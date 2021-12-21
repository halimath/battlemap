import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

import { BattleMap } from "./core"

export const BattleMapViewer = wecco.define("battlemap-viewer", (data: BattleMap, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    const createScenic = (e: Event) => {
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s !== null) {
            s.scene = createScene(data)
            return
        }
        scenic.Scenic.create({
            canvas: canvas,
            scene: createScene(data),
            move: true,
            select: false,
            resize: true,
            zoom: true,
            viewport: scenic.Viewport.create({
                origin: [5, 5],
            }),
        })
    }

    return wecco.shadow(wecco.html`
        <style>           
            :host {           
                display: flex;
                align-items: stretch;
            }

            canvas {
                flex-grow: 4;
            }
        </style>
        <canvas @update=${createScenic}></canvas>
    `)
})

function createScene(data: BattleMap): scenic.Scene {
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

