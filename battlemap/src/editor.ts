import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

import { BattleMap, updatePositions, createScene } from "./core"
import { DefaultDrawingStyle, DefaultZoneStyle } from "./styles"
import { Token, Zone, Drawing } from "./shapes"

export type Action = "move" | "draw" | "zone" | "token" | "remove"

export interface EditorData extends BattleMap {
    viewport?: scenic.Viewport
    action?: Action
}

export const UpdatedEvent = "battlemapUpdated"

export type UpdatedEventDetails = BattleMap

export const Editor = wecco.define("battlemap-editor", (data: EditorData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    data.background = data.background ?? []
    data.explanations = data.explanations ?? []
    data.tokens = data.tokens ?? []
    data.action = data.action ?? "move"
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
                    data.explanations!.push(Zone.create({
                        at: evt.points[0],
                        size: evt.points[0].diff(evt.points[1]),
                        label: `Zone #${data.explanations!.length + 1}`
                    }))
                } else if (data.action === "draw") {
                    data.background!.push(Drawing.create({
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
        s.viewport = data.viewport!
    }

    return wecco.shadow(wecco.html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <style>
            :host {
                --toolbar-border: 2px solid #333;
                --toolbar-button-color: rgb(2 132 199);
                --toolbar-button-color-selected: rgb(7 89 133);
                --toolbar-button-color-disabled: #7c7c7c;

                display: flex;
                align-items: stretch;
            }

            * {
                box-sizing: border-box;
            }

            .toolbar {
                min-width: 8rem;

                border-right: var(--toolbar-border);
                padding: 2px;

                display: flex;
                flex-direction: column;
                align-items: center;

                background-color: #eaeaea;
            }

            .toolbar > button {
                min-width: 6rem;
                margin-bottom: 4px;

                background-color: var(--toolbar-button-color);
                color: white;

                border: 1px solid var(--toolbar-button-color);
                border-radius: 4px;
            }

            .toolbar > button.selected {
                background-color: var(--toolbar-button-color-selected);
            }

            .toolbar > button:disabled {
                border-color: var(--toolbar-button-color-disabled);
                background-color: var(--toolbar-button-color-disabled);
            }

            canvas {
                flex-grow: 4;
            }        
        </style>           
        ${toolbar(data, ctx)}
        <canvas @update=${createScenic}></canvas>
    `)
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
            <button @click=${() => { data.action = "draw"; ctx.requestUpdate() }} class=${data.action === "draw" ? "selected" : ""}><i class="material-icons">edit</i></button>
            <button @click=${() => { data.action = "zone"; ctx.requestUpdate() }} class=${data.action === "zone" ? "selected" : ""}><i class="material-icons">crop_free</i></button>
            <button @click=${addToken.bind(null, data, ctx)} class=${data.action === "token" ? "selected" : ""}><i class="material-icons">add_circle</i></button>
            <button @click=${() => { data.action = "remove"; ctx.requestUpdate() }} disabled class=${data.action === "remove" ? "selected" : ""}><i class="material-icons">remove_circle</i></button>
        </div>
    `
}
