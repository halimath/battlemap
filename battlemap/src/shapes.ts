import * as scenic from "@halimath/scenic"
import { Shape } from "./core"
import { DefaultDrawingStyle, DefaultZoneStyle, nextTokenStyle } from "./styles"

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
        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
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
        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
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
                        style: this.style,                    }),
                ],
            ],
        })
    }
}

export interface TokenOptions {
    id?: string,
    at: scenic.Point | scenic.XY
    style?: scenic.StyleOptions
}

export class Token implements Shape {
    static create(opts: TokenOptions): Token {
        return new Token(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            opts.style ?? nextTokenStyle(),
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public style: scenic.StyleOptions,
    ) { }

    createSceneElement(): scenic.SceneElement {
        const outline = new Path2D()
        outline.rect(0, 0, 50, 50)

        return scenic.SceneElement.create({
            id: this.id,
            at: this.at,
            outline: outline,
            movable: true,

            paintables: scenic.Path.ellipse({
                size: 50,
                closed: true,
                style: this.style,
            })
        })
    }
}