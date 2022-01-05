import * as scenic from "@halimath/scenic"
import { Shape } from "./core"
import { DefaultDrawingStyle, DefaultZoneStyle, DefaultTokenColor, tokenStyle } from "./styles"

export const GridSize = 50

export interface DrawingOptions {
    id?: string
    at: scenic.Point | scenic.XY
    points: Array<scenic.Point | scenic.XY>
    style?: scenic.StyleOptions
}

export class Drawing implements Shape {
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

export class Zone implements Shape {
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

export class Token implements Shape {    
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
