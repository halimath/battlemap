package battlemap

import "time"

type BattleMap struct {
	ID           string
	LastModified time.Time
	Grid         bool
	Drawings     []Drawing
	Zones        []Zone
	Tokens       []Token
}

type Vertex [2]float32

type Drawing struct {
	ID       string
	At       Vertex
	Vertices []Vertex
}

type Zone struct {
	ID    string
	At    Vertex
	Size  Vertex
	Label string
}

type Token struct {
	ID    string
	At    Vertex
	Color string
}
