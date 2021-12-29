import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

import { BattleMap, createScene, ViewportChangedEvent, ViewportChangedEventDetails } from "../core"

export interface ViewerData extends BattleMap {
    viewport?: scenic.Viewport
}

export const Viewer = wecco.define("battlemap-viewer", (data: ViewerData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    const createScenic = (e: Event) => {
        console.log(data.viewport)
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s === null) {
            s = scenic.Scenic.create({
                canvas: canvas,
                scene: createScene(data),
                viewport: data.viewport ?? scenic.Viewport.create({
                    origin: [5, 5],
                }),    
                move: true,
                select: false,
                resize: true,
                zoom: true
            })
                .on("viewportChanged", evt => {
                    data.viewport = evt.source.viewport
                    // No need to trigger a repaint here. Simply update our element's model to reflect the
                    // changes made by scenic.
                    ctx.emit(ViewportChangedEvent, data.viewport as ViewportChangedEventDetails)
                })
        } else {
            s.scene = createScene(data)
            s.viewport = data.viewport ?? s.viewport
        }    
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


