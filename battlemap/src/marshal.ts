import { BattleMap, Shape } from "./core"
import { Drawing, Zone, Token } from "./shapes"

interface MarshaledShape {
    type: "drawing" | "zone" | "token"
    id: string
    at: [number, number]
    points?: Array<[number, number]>
    size?: [number, number]
    label?: string
    color?: string
}

interface MarshaledBattleMap {
    background: Array<MarshaledShape>
    explanations: Array<MarshaledShape>
    tokens: Array<MarshaledShape>
    grid: boolean
}

export function marshalBattleMap(m: BattleMap): string {
    return JSON.stringify({
        background: m.background?.map(marshalShape) ?? [],
        explanations: m.explanations?.map(marshalShape) ?? [],
        tokens: m.tokens?.map(marshalShape) ?? [],
        grid: m.grid ?? false,
    })
}

export function unmarshalBattleMap(s: string): BattleMap {
    const o: MarshaledBattleMap = JSON.parse(s)

    return {
        background: o.background.map(unmarshalShape),
        explanations: o.explanations.map(unmarshalShape),
        tokens: o.tokens.map(unmarshalShape),
        grid: o.grid,
    }
}

function unmarshalShape(m: MarshaledShape): Shape {
    switch (m.type) {
        case "drawing":
            return Drawing.create({
                id: m.id,
                at: m.at,
                points: m.points ?? [],
            })
        case "zone":
            return Zone.create({
                id: m.id,
                at: m.at,
                size: m.size ?? [0, 0],
                label: m.label ?? "",
            })
        case "token":
            return Token.create({
                id: m.id,
                at: m.at,
                color: m.color ?? "#000000"
            })
        default:
            throw new Error(`unexpected shape type: ${m.type}`)
    }
}

function marshalShape(s: Shape): MarshaledShape {
    if (s instanceof Drawing) {
        return {
            type: "drawing",
            id: s.id,
            at: [s.at.x, s.at.y],
            points: s.points.map(p => [p.x, p.y]),
        }
    }

    if (s instanceof Zone) {
        return {
            type: "zone",
            id: s.id,
            at: [s.at.x, s.at.y],
            size: [s.size.x, s.size.y],
            label: s.label,
        }
    }

    if (s instanceof Token) {
        return {
            type: "token",
            id: s.id,
            at: [s.at.x, s.at.y],
            color: s.color.toHex(),
        }
    }

    throw new Error(`Unexpected shape: ${s}`)
}
