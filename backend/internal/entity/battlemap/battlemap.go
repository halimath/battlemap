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

type XY [2]int

type Drawing struct {
	ID     string
	At     XY
	Points []XY
}

type Zone struct {
	ID    string
	At    XY
	Size  XY
	Label string
}

type Token struct {
	ID    string
	At    XY
	Color string
}
