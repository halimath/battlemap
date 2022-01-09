package entity

type BattleMap struct {
	ID           string  `json:"id"`
	Grid         bool    `json:"grid"`
	Background   []Shape `json:"background"`
	Explanations []Shape `json:"explanations"`
	Tokens       []Shape `json:"tokens"`
}

type ShapeType string

const (
	TypeDrawing ShapeType = "drawing"
	TypeZone    ShapeType = "zone"
	TypeToken   ShapeType = "token"
)

type XY [2]int

type Shape struct {
	ID     string    `json:"id"`
	Type   ShapeType `json:"type"`
	At     XY        `json:"at"`
	Points []XY      `json:"points,omitempty"`
	Size   XY        `json:"size,omitempty"`
	Label  string    `json:"label,omitempty"`
	Color  string    `json:"color,omitempty"`
}
