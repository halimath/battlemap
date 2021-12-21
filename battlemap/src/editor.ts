import * as wecco from "@weccoframework/core"
import * as scenic from "@halimath/scenic"

// import "./index.css"

import { BattleMap, updatePositions } from "./core"
import { Zone } from "./shapes"

export type Action = "move" | "draw" | "zone" | "token" | "remove"

export interface BattleMapEditorData extends BattleMap {
    action?: Action
}

export const BattleMapEditor = wecco.define("battlemap-editor", (data: BattleMapEditorData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    data.background = data.background ?? []
    data.explanations = data.explanations ?? []
    data.tokens = data.tokens ?? []
    data.action = data.action ?? "move"

    const createScenic = (e: Event) => {
        const canvas = e.target as HTMLCanvasElement

        let s = scenic.Scenic.forCanvas(canvas)

        if (s !== null) {
            s.scene = createScene(data)

            s.move = data.action === "move"
            s.select = data.action === "move"
            s.drawingMode = (data.action === "zone") ? "rect" : (data.action === "draw" ? "line" : null)

            return
        }

        scenic.Scenic.create({
            canvas: canvas,
            scene: createScene(data),
            move: data.action === "move",
            select: data.action === "move",
            resize: true,
            zoom: true,
            drawingMode: (data.action === "zone") ? "rect" : (data.action === "draw" ? "line" : null),
            viewport: scenic.Viewport.create({
                origin: [5, 5],
            }),
        }).on("sceneUpdated", evt => {
            updatePositions(data, evt.source.scene)
            // No need to trigger a repaint here. Simply update our element's model to reflect the
            // changes made by scenic.
        }).on("drawingFinished", evt => {
            if (data.action === "zone") {
                data.explanations!.push(Zone.create({
                    at: evt.start,
                    size: evt.start.diff(evt.end),
                    label: `Zone #${data.explanations!.length + 1}`
                }))
            }
            ctx.requestUpdate()            
        })
    }

    // return (wecco.html`
    return wecco.shadow(wecco.html`
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

function toolbar(data: BattleMapEditorData, ctx: wecco.RenderContext): wecco.ElementUpdate {
    return wecco.html`
        <div class="toolbar">
            <button @click=${() => { data.action = "move"; ctx.requestUpdate() }} class=${data.action === "move" ? "selected" : ""}>move</button>
            <button @click=${() => { data.action = "draw"; ctx.requestUpdate() }} class=${data.action === "draw" ? "selected" : ""}>draw</button>
            <button @click=${() => { data.action = "zone"; ctx.requestUpdate() }} class=${data.action === "zone" ? "selected" : ""}>zone</button>
            <button @click=${() => { data.action = "token"; ctx.requestUpdate() }} class=${data.action === "token" ? "selected" : ""}>token</button>
            <button @click=${() => { data.action = "remove"; ctx.requestUpdate() }} disabled class=${data.action === "remove" ? "selected" : ""}>remove</button>
        </div>
    `
}
