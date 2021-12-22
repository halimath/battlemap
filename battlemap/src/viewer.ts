import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

import { BattleMap, createScene } from "./core"

export interface ViewerData extends BattleMap {
    viewport?: scenic.Viewport
}

export const Viewer = wecco.define("battlemap-viewer", (data: ViewerData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    data.viewport = data.viewport ?? scenic.Viewport.create({
        origin: [5, 5],
    })

    const createScenic = (e: Event) => {
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s !== null) {
            s.scene = createScene(data)
            s.viewport = data.viewport!
            return
        }

        scenic.Scenic.create({
            canvas: canvas,
            scene: createScene(data),
            move: true,
            select: false,
            resize: true,
            zoom: true,
            viewport: data.viewport!
        })
            .on("viewportChanged", evt => {
                data.viewport = evt.source.viewport
                // No need to trigger a repaint here. Simply update our element's model to reflect the
                // changes made by scenic.
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


