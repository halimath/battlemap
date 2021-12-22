import * as scenic from "@halimath/scenic"

export const DefaultDrawingColor = scenic.Color.fromRGBBytes(10, 10, 10)

export const DefaultDrawingStyle: scenic.StyleOptions = {
    strokeStyle: DefaultDrawingColor,
    lineJoin: "round",
    lineWidth: 5,
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

export const TokenColors = [
    scenic.Color.parseHex("#b91c1c"),
    scenic.Color.parseHex("#a16207"),
    scenic.Color.parseHex("#4d7c0f"),
    scenic.Color.parseHex("#0e7490"),
    scenic.Color.parseHex("#1d4ed8"),
    scenic.Color.parseHex("#7e22ce"),
    scenic.Color.parseHex("#be123c"),
]

export const TokenStyleOptions: scenic.StyleOptions = {
    lineWidth: 5,
    shadowColor: "#666",
    shadowBlur: 5,
    shadowOffsetX: 5,
    shadowOffsetY: 5,    
}

export function tokenStyle (c: scenic.Color): scenic.StyleOptions {
    return merge({
        strokeStyle: c,
        fillStyle: c.lighten(0.5).withAlpha(0.5),    
    }, TokenStyleOptions)
}

function merge<A extends object, B extends object>(a: A, b: B): A & B {
    return Object.assign({}, a, b)
}

let lastTokenColorIndex = 0

export function nextTokenStyle(): scenic.StyleOptions {
    return tokenStyle(TokenColors[lastTokenColorIndex++ % TokenColors.length])
}
