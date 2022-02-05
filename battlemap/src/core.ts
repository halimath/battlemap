import * as scenic from "@halimath/scenic"

export const DefaultDrawingColor = scenic.Color.fromRGBBytes(10, 10, 10)

export const DefaultDrawingStyle: scenic.StyleOptions = {
    strokeStyle: DefaultDrawingColor,
    lineJoin: "round",
    lineWidth: 5,
    shadowColor: DefaultDrawingColor,
    shadowBlur: 5,
}

const DefaultZoneColor = scenic.Color.fromRGBBytes(2, 132, 199)
export const DefaultZoneStyle: scenic.StyleOptions = {
    strokeStyle: DefaultZoneColor,
    lineWidth: 5,
    lineJoin: "round",
    lineDash: [15, 5],
    fontFamily: "verdana, helvetica, arial, sans-serif",
    fontSize: 20,
}

export const DefaultTokenColor = scenic.Color.parseHex("#b91c1c")

export const TokenStyleOptions: scenic.StyleOptions = {
    lineWidth: 5,
    shadowColor: "#666",
    shadowBlur: 5,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
}

export function tokenStyle(c: scenic.Color | string): scenic.StyleOptions {
    let color: scenic.Color
    if (typeof c === "string") {
        color = scenic.Color.parseHex(c)
    } else {
        color = c
    }

    return merge({
        strokeStyle: color,
        fillStyle: color.lighten(0.5).withAlpha(0.5),
    }, TokenStyleOptions)
}

function merge<A extends object, B extends object>(a: A, b: B): A & B {
    return Object.assign({}, a, b)
}

export const GridSize = 50

export interface Shape {
    id: string
    at: scenic.Point
}

export interface DrawingOptions {
    id?: string
    at: scenic.Point | scenic.XY
    points: Array<scenic.Point | scenic.XY>
    style?: scenic.StyleOptions
}

export class Drawing {
    static create(opts: DrawingOptions): Drawing {
        return new Drawing(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            opts.points.map(scenic.Point.create),
            opts.style ?? DefaultDrawingStyle,
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public points: Array<scenic.Point>,
        public style: scenic.StyleOptions,
    ) { }

    createSceneElement(): scenic.SceneElement {
        let minX = 0
        let maxX = 0
        let minY = 0
        let maxY = 0

        this.points.forEach(p => {
            if (p.x < minX) {
                minX = p.x
            }
            if (p.x > maxX) {
                maxX = p.x
            }
            if (p.y < minY) {
                minY = p.y
            }
            if (p.y > maxY) {
                maxY = p.y
            }
        })

        const outline = new Path2D()
        outline.rect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20)

        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
            outline: outline,
            paintables: scenic.Path.create({
                d: this.points,
                style: DefaultDrawingStyle,
            })
        })
    }
}

export interface ZoneOptions {
    id?: string
    at: scenic.Point | scenic.XY
    size: scenic.Dimension | scenic.XY
    label?: string
    style?: scenic.StyleOptions
}

export class Zone {
    static create(opts: ZoneOptions): Zone {
        return new Zone(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            scenic.Dimension.create(opts.size),
            opts.label ?? "Zone",
            opts.style ?? DefaultZoneStyle,
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public size: scenic.Dimension,
        public label: string,
        public style: scenic.StyleOptions,
    ) { }

    createSceneElement(): scenic.SceneElement {
        const outline = new Path2D()
        outline.rect(-10, -10, this.size.x + 20, this.size.y + 20)

        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
            outline: outline,
            paintables: [
                scenic.Path.rectangle({
                    size: this.size,
                    closed: true,
                    style: this.style,
                }),
                [
                    [10, 25],
                    scenic.Text.create({
                        text: this.label,
                        style: this.style,
                    }),
                ],
            ],
        })
    }
}

export interface TokenOptions {
    id?: string,
    at: scenic.Point | scenic.XY
    color?: scenic.Color | string
    style?: scenic.StyleOptions
}

export class Token {
    static create(opts: TokenOptions): Token {
        let color = DefaultTokenColor
        if (opts.color) {
            if (typeof opts.color === "string") {
                color = scenic.Color.parseHex(opts.color)
            } else {
                color = opts.color
            }
        }

        return new Token(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            opts.style ?? tokenStyle(color),
            color,
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public style: scenic.StyleOptions,
        public color: scenic.Color,
    ) { }

    createSceneElement(): scenic.SceneElement {
        const outline = new Path2D()
        outline.rect(-10, -10, GridSize + 10, GridSize + 10)

        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
            outline: outline,
            movable: true,

            paintables: scenic.Path.ellipse({
                size: GridSize - 10,
                closed: true,
                style: this.style,
            })
        })
    }
}

export interface BattleMap {
    drawings?: Array<Drawing>
    zones?: Array<Zone>
    tokens?: Array<Token>
    grid?: boolean
}

export function updatePositions(battleMap: BattleMap, scene: scenic.Scene): void {
    allShapes(battleMap).forEach(s => {
        s.at = scene.findElement(s.id)?.at ?? s.at
    })
}

export function removeShape(battleMap: BattleMap, ...shapeIds: Array<string>): void {
    shapeIds.forEach(id => {
        let idx = battleMap.drawings?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.drawings?.splice(idx, 1)
            return
        }

        idx = battleMap.zones?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.zones?.splice(idx, 1)
            return
        }

        idx = battleMap.tokens?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.tokens?.splice(idx, 1)
        }
    })
}

export function findShapeById(battleMap: BattleMap, id: string): Shape | null {
    return allShapes(battleMap).find(s => s.id === id) ?? null
}

function allShapes(battleMap: BattleMap): Array<Shape> {
    let shapes: Array<Shape> = battleMap.drawings ?? []
    shapes = shapes.concat(battleMap.zones ?? [])
    shapes = shapes.concat(battleMap.tokens ?? [])

    return shapes
}

export function createScene(data: BattleMap): scenic.Scene {
    return new scenic.Scene(
        new scenic.Layer(
            "background",
            ...data.drawings?.map(s => s.createSceneElement()) ?? []
        ),
        new scenic.Layer(
            "explanations",
            ...data.zones?.map(s => s.createSceneElement()) ?? []
        ),
        new scenic.Layer(
            "tokens",
            ...data.tokens?.map(s => s.createSceneElement()) ?? []
        ),
    )
}

export const BattleMapUpdatedEvent = "battlemapUpdated"
export type BattleMapUpdatedEventDetails = BattleMap

export const ViewportChangedEvent = "viewportchanged"
export type ViewportChangedEventDetails = scenic.Viewport
