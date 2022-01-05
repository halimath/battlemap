
import * as scenic from "@halimath/scenic"
import * as wecco from "@weccoframework/core"

import { BattleMap, createScene, updatePositions, BattleMapUpdatedEvent, BattleMapUpdatedEventDetails, ViewportChangedEvent, ViewportChangedEventDetails } from "../core"
import { Drawing, Token, Zone, GridSize } from "../shapes"
import { DefaultDrawingStyle, DefaultZoneStyle, DefaultTokenColor } from "../styles"

import styles from "./editor.css"

export type Action = "move" | "draw" | "zone" | "token" | "remove"

export interface EditorData extends BattleMap {
    viewport?: scenic.Viewport
    action?: Action
    showGrid?: boolean
    tokenColor?: string
    drawingMode?: scenic.DrawingMode
    fullscreen?: boolean
}

export const Editor = wecco.define("battlemap-editor", (data: EditorData, ctx: wecco.RenderContext): wecco.ElementUpdate => {    
    data.background = data.background ?? []
    data.explanations = data.explanations ?? []
    data.tokens = data.tokens ?? []
    data.action = data.action ?? "move"

    const createScenic = (e: Event) => {
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s === null) {
            s = scenic.Scenic.create({
                canvas: canvas,
                scene: createScene(data),
                move:  data.action === "move",
                select:  data.action === "move",
                drawingMode:  (data.action === "zone") ? "rect" : (data.action === "draw" ? (data.drawingMode ?? "line") : null),
                drawingStyle:  scenic.Style.create(data.action === "zone" ? DefaultZoneStyle : DefaultDrawingStyle),
                grid:  data.showGrid ?? false,
                viewport: data.viewport ?? scenic.Viewport.create({ origin: 5 }),
    
                resize: true,
                zoom: true,
                selectionStyle: {
                    strokeStyle: "#ffb600",
                    lineWidth: 2,
                    lineDash: [2, 2],
                    shadowColor: "#ffb600",
                    shadowBlur: 5,
                },
                gridSize: GridSize,
            }).on("sceneUpdated", evt => {
                updatePositions(data, evt.source.scene)
                ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
                // No need to trigger a repaint here. Simply update our element's model to reflect the
                // changes made by scenic.
            }).on("viewportChanged", evt => {
                data.viewport = evt.source.viewport
                ctx.emit(ViewportChangedEvent, data.viewport as ViewportChangedEventDetails)
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
                    let points: Array<scenic.Point | scenic.XY>

                    if ((typeof data.drawingMode === "undefined") || (data.drawingMode === "line")) {
                        points = evt.points.map(p => p.translate(-evt.points[0].x, -evt.points[0].y))
                    } else if (data.drawingMode === "rect") {
                        points = [
                            0, 
                            [evt.points[1].x - evt.points[0].x, 0],
                            [evt.points[1].x - evt.points[0].x, evt.points[1].y - evt.points[0].y],
                            [0, evt.points[1].y - evt.points[0].y],
                            [0, 0],
                        ]
                    } else {
                        throw new Error(`Unexpected drawing mode: '${data.drawingMode}'`)
                    }

                    data.background?.push(Drawing.create({
                        at: evt.points[0],
                        points: points,
                    }))
                }

                ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
                ctx.requestUpdate()
            })
        } else {
            s.scene = createScene(data)
            s.move = data.action === "move"
            s.select = data.action === "move"
            s.drawingMode = (data.action === "zone") ? "rect" : (data.action === "draw" ? (data.drawingMode ?? "line") : null)
            s.drawingStyle = scenic.Style.create(data.action === "zone" ? DefaultZoneStyle : DefaultDrawingStyle)
            s.grid = data.showGrid ?? false
            s.viewport = data.viewport ?? s.viewport
        }
    }

    return wecco.shadow(wecco.html`
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            <style .innerText=${styles}></style>
            ${toolbar(data, ctx)}
            <canvas @update=${createScenic}></canvas>
        `)
})

function addToken(data: EditorData, ctx: wecco.RenderContext) {
    data.tokens?.push(Token.create({
        at: [10, 10],
        color: data.tokenColor ?? DefaultTokenColor
    }))
    data.action = "move"

    ctx.requestUpdate()
    ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
}

function clear(data: EditorData, ctx: wecco.RenderContext) {
    data.background = []
    data.explanations = []
    data.tokens = []
    data.viewport = undefined

    ctx.requestUpdate()
    ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
}

function toolbar(data: EditorData, ctx: wecco.RenderContext): wecco.ElementUpdate {
    return wecco.html`
        <div class="toolbar">
            
            <button @click=${() => { data.action = "move"; ctx.requestUpdate() }} class=${data.action === "move" ? "selected" : ""}><i class="material-icons">pan_tool</i></button>
            <button @click=${() => { data.action = "remove"; ctx.requestUpdate() }} disabled class=${data.action === "remove" ? "selected" : ""}><i class="material-icons">delete</i></button>
            
            <div class="divider"></div>
            
            <div class="control ${data.action === "draw" ? "selected" : ""}">
                <button @click=${() => { data.action = "draw"; ctx.requestUpdate() }}><i class="material-icons">edit</i></button>
                <select @change=${(e: Event) => {data.drawingMode = (e.target as HTMLSelectElement).value as scenic.DrawingMode; ctx.requestUpdate()}}>
                    <option value="line">Line</option>
                    <option value="rect">Rect</option>
                </select>
            </div>
            
            <div class="divider"></div>
            
            <button @click=${() => { data.action = "zone"; ctx.requestUpdate() }} class=${data.action === "zone" ? "selected" : ""}><i class="material-icons">crop_free</i></button>
            
            <div class="divider"></div>

            <div class="control ${data.action === "token" ? "selected" : ""}">
                <button @click=${addToken.bind(null, data, ctx)} class=${data.action === "token" ? "selected" : ""}><i class="material-icons">add_circle</i></button>
                <input type="color" value=${data.tokenColor ?? DefaultTokenColor.toHex()} @change=${(e: InputEvent) => {
                    data.tokenColor = (e.target as HTMLInputElement).value
                }}>
            </div>
            
            <div class="divider"></div>
            
            <div class="checkbox">
                <input type="checkbox" ?checked=${data.showGrid ?? false} @change=${(e: InputEvent) => {
                data.showGrid = (e.target as HTMLInputElement).checked
                if ((!data.showGrid) && data.grid) {
                    data.grid = false
                    ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
                }
                ctx.requestUpdate()
            }}>
                Grid
            </div>
            <div class="checkbox">
                <input type="checkbox" ?checked=${data.grid ?? false} ?disabled=${!data.showGrid} @change=${(e: InputEvent) => {
                data.grid = (e.target as HTMLInputElement).checked
                ctx.emit(BattleMapUpdatedEvent, data as BattleMapUpdatedEventDetails)
            }}>
                Activate on 
            </div>
            
            <div class="divider"></div>
            
            <button @click=${clear.bind(undefined, data, ctx)} class="danger"><i class="material-icons">close</i></button>

            <div class="divider"></div>
            
            <button @click=${toggleFullscreen.bind(undefined, data, ctx)}><i class="material-icons">${data.fullscreen ? "fullscreen_exit" : "fullscreen"}</i></button>
        </div>
    `
}

function toggleFullscreen (data: EditorData, ctx: wecco.RenderContext, evt: Event) {
    if (data.fullscreen) {
        data.fullscreen = false
        document.exitFullscreen()
    } else {
        data.fullscreen = true;
        ((evt.target as HTMLElement).getRootNode() as ShadowRoot)?.host.requestFullscreen()
    }

    ctx.requestUpdate()
}
