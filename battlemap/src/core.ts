import * as scenic from "@halimath/scenic"

export interface Shape {
    id: string
    at: scenic.Point
    createSceneElement(): scenic.SceneElement
}

export interface BattleMap {
    background?: Array<Shape>
    explanations?: Array<Shape>
    tokens?: Array<Shape>
    grid?: boolean
}

export function updatePositions (battleMap: BattleMap, scene: scenic.Scene): void {
    allShapes(battleMap).forEach(s => {
        s.at = scene.findElement(s.id)?.at ?? s.at
    })
}

export function removeShape(battleMap: BattleMap, ...shapeIds: Array<string>): void {
    shapeIds.forEach(id => {
        let idx = battleMap.background?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.background?.splice(idx, 1)
            return
        }

        idx = battleMap.explanations?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.explanations?.splice(idx, 1)
            return
        }

        idx = battleMap.tokens?.findIndex(s => s.id === id) ?? -1
        if (idx >= 0) {
            battleMap.tokens?.splice(idx, 1)
        }
    })
}

export function findShapeById (battleMap: BattleMap, id: string): Shape | null {
    return allShapes(battleMap).find(s => s.id === id) ?? null
}

function allShapes (battleMap: BattleMap): Array<Shape> {
    let shapes = battleMap.background ?? []
    shapes = shapes.concat(battleMap.explanations ?? [])
    shapes = shapes.concat(battleMap.tokens ?? [])

    return shapes
}

export function createScene(data: BattleMap): scenic.Scene {
    return new scenic.Scene(
        new scenic.Layer(
            "background",
            ...data.background?.map(s => s.createSceneElement()) ?? []
        ),
        new scenic.Layer(
            "explanations",
            ...data.explanations?.map(s => s.createSceneElement()) ?? []
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
