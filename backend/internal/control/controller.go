package control

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/halimath/battlemap/backend/internal/entity/battlemap"
)

var (
	ErrForbidden = errors.New("not allowed to update battlemap")
	ErrNotExists = errors.New("battle map does not exist")
)

type battleMapEntry struct {
	lock         sync.Mutex
	data         battlemap.BattleMap
	lastModified time.Time
	userID       string
}

// --

type BattleMapController struct {
	lock sync.RWMutex
	maps map[string]*battleMapEntry
}

func (c *BattleMapController) Update(ctx context.Context, userID string, data battlemap.BattleMap) error {
	c.lock.Lock()
	defer c.lock.Unlock()

	e, ok := c.maps[data.ID]
	if !ok {
		e = &battleMapEntry{
			userID: userID,
		}
		c.maps[data.ID] = e
	}

	if e.userID != userID {
		return ErrForbidden
	}

	e.lock.Lock()
	defer e.lock.Unlock()

	e.data = data
	e.lastModified = time.Now()

	return nil
}

func (c *BattleMapController) Load(ctx context.Context, id string) (battlemap.BattleMap, time.Time, error) {
	c.lock.RLock()
	defer c.lock.RUnlock()

	e, ok := c.maps[id]
	if !ok {
		return battlemap.BattleMap{}, time.Time{}, ErrNotExists
	}

	return e.data, e.lastModified, nil
}

func Provide() *BattleMapController {
	return &BattleMapController{
		maps: make(map[string]*battleMapEntry),
	}
}
