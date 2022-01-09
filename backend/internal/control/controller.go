package control

import (
	"errors"
	"sync"

	"github.com/halimath/battlemap/backend/internal/entity"
	"github.com/halimath/kvlog"
)

const (
	viewerChannelBufferSize = 10
)

var (
	ErrAlreadyExists  = errors.New("battle map already exists")
	ErrNotExists      = errors.New("battle map does not exist")
	ErrViewerNotFound = errors.New("viewer not found")
)

type battleMapMultiplexer struct {
	id        string
	lock      sync.Mutex
	lastState entity.BattleMap
	editor    chan entity.BattleMap
	viewer    []chan entity.BattleMap
}

func (m *battleMapMultiplexer) run() {
	for b := range m.editor {
		kvlog.Info(kvlog.Evt("multiplexingBattlemapUpdate"), kvlog.KV("id", m.id))
		m.lock.Lock()
		m.lastState = b
		for _, v := range m.viewer {
			v <- m.lastState
		}
		m.lock.Unlock()
	}

	for _, v := range m.viewer {
		close(v)
	}
}

func (m *battleMapMultiplexer) close() {
	close(m.editor)
}

func (m *battleMapMultiplexer) addViewer() <-chan entity.BattleMap {
	m.lock.Lock()
	defer m.lock.Unlock()

	c := make(chan entity.BattleMap, viewerChannelBufferSize)

	m.viewer = append(m.viewer, c)
	c <- m.lastState

	return c
}

func (m *battleMapMultiplexer) removeViewer(c <-chan entity.BattleMap) error {
	m.lock.Lock()
	defer m.lock.Unlock()

	for i, vc := range m.viewer {
		if vc == c {
			close(vc)

			m.viewer[i] = m.viewer[len(m.viewer)-1]
			m.viewer = m.viewer[:len(m.viewer)-1]
			return nil
		}
	}

	return ErrViewerNotFound
}

// --

type BattleMapController struct {
	lock sync.RWMutex
	maps map[string]*battleMapMultiplexer
}

func (c *BattleMapController) BeginEdit(id string) (chan<- entity.BattleMap, error) {
	c.lock.Lock()
	defer c.lock.Unlock()

	if _, ok := c.maps[id]; ok {
		return nil, ErrAlreadyExists
	}

	m := &battleMapMultiplexer{
		id:     id,
		editor: make(chan entity.BattleMap),
		viewer: make([]chan entity.BattleMap, 0),
	}

	go m.run()

	c.maps[id] = m

	return m.editor, nil
}

func (c *BattleMapController) EndEdit(id string) error {
	c.lock.Lock()
	defer c.lock.Unlock()

	b, ok := c.maps[id]

	if !ok {
		return ErrNotExists
	}

	b.close()

	delete(c.maps, id)

	return nil
}

func (c *BattleMapController) BeginView(id string) (<-chan entity.BattleMap, error) {
	c.lock.RLock()
	defer c.lock.RUnlock()

	b, ok := c.maps[id]
	if !ok {
		return nil, ErrNotExists
	}

	return b.addViewer(), nil
}

func (c *BattleMapController) EndView(id string, viewer <-chan entity.BattleMap) error {
	c.lock.RLock()
	defer c.lock.RUnlock()

	b, ok := c.maps[id]
	if !ok {
		return ErrNotExists
	}

	return b.removeViewer(viewer)
}

func Provide() *BattleMapController {
	return &BattleMapController{
		maps: make(map[string]*battleMapMultiplexer),
	}
}
