
import * as scenic from "@halimath/scenic"
import * as wecco from "@weccoframework/core"
import { BattleMap, createScene, updatePositions } from "../core"
import styles from "./editor.css"
import { Drawing, Token, Zone, GridSize } from "../shapes"
import { DefaultDrawingStyle, DefaultZoneStyle } from "../styles"

import { ToggleSwitch } from "./toggle"

export type Action = "move" | "draw" | "zone" | "token" | "remove"

export interface EditorData extends BattleMap {
    viewport?: scenic.Viewport
    action?: Action
    grid?: boolean
}

export const UpdatedEvent = "battlemapUpdated"

export type UpdatedEventDetails = BattleMap

export const Editor = wecco.define("battlemap-editor", (data: EditorData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    data.background = data.background ?? []
    data.explanations = data.explanations ?? []
    data.tokens = data.tokens ?? []
    data.action = data.action ?? "move"
    data.grid = data.grid ?? false
    data.viewport = data.viewport ?? scenic.Viewport.create({
        origin: [5, 5],
    })

    const createScenic = (e: Event) => {
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s === null) {
            s = scenic.Scenic.create({
                canvas: canvas,
                scene: createScene(data),
                resize: true,
                zoom: true,
                selectionStyle: {
                    strokeStyle: "#0069dba0",
                    lineWidth: 2,
                    lineDash: [2, 2],
                    shadowColor: "#0083ff",
                    shadowBlur: 5,
                },
                gridSize: GridSize,
            }).on("sceneUpdated", evt => {
                updatePositions(data, evt.source.scene)
                ctx.emit(UpdatedEvent, data)
                // No need to trigger a repaint here. Simply update our element's model to reflect the
                // changes made by scenic.
            }).on("viewportChanged", evt => {
                data.viewport = evt.source.viewport
                // No need to trigger a repaint here. Simply update our element's model to reflect the
                // changes made by scenic.            
            }).on("drawingFinished", evt => {
                if (data.action === "zone") {
                    data.explanations?.push(Zone.create({
                        at: evt.points[0],
                        size: evt.points[0].diff(evt.points[1]),
                        label: `Zone #${data.explanations?.length + 1}`
                    }))
                } else if (data.action === "draw") {
                    data.background?.push(Drawing.create({
                        at: evt.points[0],
                        points: evt.points.map(p => p.translate(-evt.points[0].x, -evt.points[0].y)),
                    }))
                }

                ctx.emit(UpdatedEvent, data)
                ctx.requestUpdate()
            })
        }

        s.scene = createScene(data)

        s.move = data.action === "move"
        s.select = data.action === "move"
        s.drawingMode = (data.action === "zone") ? "rect" : (data.action === "draw" ? "poly" : null)
        s.drawingStyle = scenic.Style.create(data.action === "zone" ? DefaultZoneStyle : DefaultDrawingStyle)
        s.grid = data.grid ?? false
        s.viewport = data.viewport ?? s.viewport
    }

    const styleElement = document.createElement("style")
    styleElement.textContent = styles

    return wecco.shadow([
        styleElement,
        wecco.html`
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            ${toolbar(data, ctx)}
            <canvas @update=${createScenic}></canvas>
        `
    ])
})

function addToken(data: EditorData, ctx: wecco.RenderContext) {
    data.tokens?.push(Token.create({
        at: [10, 10],
    }))

    ctx.requestUpdate()
}

function toolbar(data: EditorData, ctx: wecco.RenderContext): wecco.ElementUpdate {
    return wecco.html`
        <div class="toolbar">
            <button @click=${() => { data.action = "move"; ctx.requestUpdate() }} class=${data.action === "move" ? "selected" : ""}><i class="material-icons">pan_tool</i></button>
            <div class="divider"></div>
            <button @click=${() => { data.action = "draw"; ctx.requestUpdate() }} class=${data.action === "draw" ? "selected" : ""}><i class="material-icons">edit</i></button>
            <div class="divider"></div>
            <button @click=${() => { data.action = "zone"; ctx.requestUpdate() }} class=${data.action === "zone" ? "selected" : ""}><i class="material-icons">crop_free</i></button>
            <div class="divider"></div>
            <button @click=${addToken.bind(null, data, ctx)} class=${data.action === "token" ? "selected" : ""}><i class="material-icons">add_circle</i></button>
            <button @click=${() => { data.action = "remove"; ctx.requestUpdate() }} disabled class=${data.action === "remove" ? "selected" : ""}><i class="material-icons">remove_circle</i></button>
            <div class="divider"></div>
            ${ToggleSwitch({
                label: "Grid",
                state: data.grid,
                onChange: s => {
                    console.log("Toggle grid")
                    data.grid = s
                    ctx.requestUpdate()
                }
            })}
        </div>
    `
}

