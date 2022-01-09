package boundary

import (
	"encoding/json"

	"github.com/halimath/battlemap/backend/internal/entity"
)

type BattleMap struct {
	ID           string  `json:"id"`
	Grid         bool    `json:"grid"`
	Background   []Shape `json:"background"`
	Explanations []Shape `json:"explanations"`
	Tokens       []Shape `json:"tokens"`
}

type XY [2]int

type Shape struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	At     XY     `json:"at"`
	Points []XY   `json:"points,omitempty"`
	Size   XY     `json:"size,omitempty"`
	Label  string `json:"label,omitempty"`
	Color  string `json:"color,omitempty"`
}

// --

func convertBattleMapToEntity(b BattleMap) entity.BattleMap {
	return entity.BattleMap{
		ID:           b.ID,
		Grid:         b.Grid,
		Background:   convertShapesToEntity(b.Background),
		Explanations: convertShapesToEntity(b.Explanations),
		Tokens:       convertShapesToEntity(b.Tokens),
	}
}

func convertShapeToEntity(s Shape) entity.Shape {
	return entity.Shape{
		ID:     s.ID,
		Type:   entity.ShapeType(s.Type),
		At:     convertXYToEntity(s.At),
		Points: convertXYsToEntity(s.Points),
		Size:   convertXYToEntity(s.Size),
		Label:  s.Label,
		Color:  s.Color,
	}
}

func convertShapesToEntity(v []Shape) (res []entity.Shape) {
	res = make([]entity.Shape, len(v))

	for i, s := range v {
		res[i] = convertShapeToEntity(s)
	}

	return
}

func convertXYsToEntity(v []XY) (res []entity.XY) {
	res = make([]entity.XY, len(v))

	for i, x := range v {
		res[i] = convertXYToEntity(x)
	}

	return
}

func convertXYToEntity(x XY) entity.XY {
	return entity.XY{x[0], x[1]}
}

// --

func convertBattleMapFromEntity(e entity.BattleMap) BattleMap {
	return BattleMap{
		ID:           e.ID,
		Grid:         e.Grid,
		Background:   convertShapesFromEntity(e.Background),
		Explanations: convertShapesFromEntity(e.Explanations),
		Tokens:       convertShapesFromEntity(e.Tokens),
	}
}

func convertShapesFromEntity(v []entity.Shape) (res []Shape) {
	res = make([]Shape, len(v))

	for i, s := range v {
		res[i] = convertShapeFromEntity(s)
	}

	return
}

func convertShapeFromEntity(e entity.Shape) Shape {
	return Shape{
		ID:     e.ID,
		Type:   string(e.Type),
		At:     convertXYFromEntity(e.At),
		Points: convertXYsFromEntity(e.Points),
		Size:   convertXYFromEntity(e.Size),
		Label:  e.Label,
		Color:  e.Color,
	}
}

func convertXYFromEntity(e entity.XY) XY {
	return XY{e[0], e[1]}
}

func convertXYsFromEntity(v []entity.XY) (res []XY) {
	res = make([]XY, len(v))

	for i, x := range v {
		res[i] = convertXYFromEntity(x)
	}

	return
}

// --

func unmarshal(data []byte) (BattleMap, error) {
	var bm BattleMap
	err := json.Unmarshal(data, &bm)
	return bm, err

}

func marshall(b BattleMap) ([]byte, error) {
	return json.Marshal(b)
}
