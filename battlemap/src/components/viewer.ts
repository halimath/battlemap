import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

import { BattleMap, createScene, ViewportChangedEvent, ViewportChangedEventDetails, GridSize } from "../core"

import styles from "./viewer.css"

export interface ViewerData extends BattleMap {
    viewport?: scenic.Viewport
    fullscreen?: boolean
}

export const Viewer = wecco.define("battlemap-viewer", (data: ViewerData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    const createScenic = (e: Event) => {
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
                zoom: true,
                grid: data.grid ?? false,
                gridSize: GridSize,
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
            s.grid = data.grid ?? false
        }
    }

    return wecco.shadow(wecco.html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <style .innerText=${styles}></style>
        ${toolbar(data, ctx)}
        <canvas @update=${createScenic}></canvas>
    `)
})

function toolbar(data: ViewerData, ctx: wecco.RenderContext): wecco.ElementUpdate {
    return wecco.html`
        <div class="toolbar">           
            <button @click=${toggleFullscreen.bind(undefined, data, ctx)}><i class="material-icons">${data.fullscreen ? "fullscreen_exit" : "fullscreen"}</i></button>
        </div>
    `
}

function toggleFullscreen(data: ViewerData, ctx: wecco.RenderContext, evt: Event) {
    if (data.fullscreen) {
        data.fullscreen = false
        document.exitFullscreen()
    } else {
        data.fullscreen = true;
        ((evt.target as HTMLElement).getRootNode() as ShadowRoot)?.host.requestFullscreen()
    }

    ctx.requestUpdate()
}


