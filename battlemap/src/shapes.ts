import * as scenic from "@halimath/scenic"
import { Shape } from "./core"

const DefaultZoneColor = scenic.Color.fromRGBBytes(2, 132, 199)
const TokenColors = [
    scenic.Color.parseHex("#b91c1c"),
    scenic.Color.parseHex("#a16207"),
    scenic.Color.parseHex("#4d7c0f"),
    scenic.Color.parseHex("#0e7490"),
    scenic.Color.parseHex("#1d4ed8"),
    scenic.Color.parseHex("#7e22ce"),
    scenic.Color.parseHex("#be123c"),
]
let lastTokenColorIndex = 0

export interface ZoneOptions {
    id?: string
    at: scenic.Point | scenic.XY
    size: scenic.Dimension | scenic.XY
    label?: string
    color?: scenic.Color
}

export class Zone implements Shape {
    static create(opts: ZoneOptions): Zone {
        return new Zone(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            scenic.Dimension.create(opts.size),
            opts.label ?? "Zone",
            opts.color ?? DefaultZoneColor,
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public size: scenic.Dimension,
        public label: string,
        public color: scenic.Color,
    ) { }

    createSceneElement(): scenic.SceneElement {
        return scenic.SceneElementGroup.create({
            id: this.id,
            at: this.at,
        },
            scenic.Path.rectangle({
                id: this.id + "-rect",
                at: [0, 0],
                size: this.size,
                closed: true,
                strokeStyle: this.color,
                lineWidth: 5,
                lineJoin: "round",
                lineDash: [15, 5],
            }),

            scenic.Text.create({
                id: this.id + "-label",
                at: [10, 25],
                text: this.label,
                fillStyle: this.color,
                fontFamily: "verdana, helvetica, arial, sans-serif",
                fontSize: 20,
            }),
        )
    }
}

export interface TokenOptions {
    id?: string,
    at: scenic.Point | scenic.XY
    color?: scenic.Color
}

export class Token implements Shape {
    static create(opts: TokenOptions): Token {
        return new Token(
            opts.id ?? scenic.randomId(),
            scenic.Point.create(opts.at),
            opts.color ?? TokenColors[lastTokenColorIndex++ % TokenColors.length],
        )
    }

    constructor(
        public readonly id: string,
        public at: scenic.Point,
        public color: scenic.Color,
    ) { }

    createSceneElement(): scenic.SceneElement {
        return scenic.Path.ellipse({
            id: this.id,
            at: this.at,
            size: 50,
            closed: true,
            strokeStyle: this.color,
            fillStyle: this.color.lighten(0.5).withAlpha(0.5),
            lineWidth: 5,
            selectable: true,
            movable: true,
            shadowColor: "#666",
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
        })
    }
}