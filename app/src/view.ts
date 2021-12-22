import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { Message, ChangeView, Reset, BattleMapUpdated } from "./control"
import { Model } from "./model"

export function root(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    if (model.view === "viewer") {
        return [
            appbar(model, ctx),
            battlemap.Viewer(model.battleMap),
        ]
    }

    const editor = battlemap.Editor(model.battleMap)
    editor.addEventListener(battlemap.UpdatedEvent, (evt: Event) => {
        ctx.emit(new BattleMapUpdated((evt as CustomEvent).detail as battlemap.BattleMap))
    })

    return [
        appbar(model, ctx),
        editor,
    ]
}

function appbar(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    return wecco.html`
        <div class="bg-sky-600 text-white p-4 mb-1 shadow-md font-sans flex justify-between">
            <div class="grow-[1]">
                <span class="text-lg font-bold">Battle Map</span>
            </div>
            <div class="grow-[4]">
                <button @click=${() => ctx.emit(new Reset())}><i class="material-icons">delete</i></button>
                <button class=${model.view === "editor" ? "selected" : ""} @click=${() => ctx.emit(new ChangeView("editor"))}><i class="material-icons">edit</i></button>
                <button class=${model.view === "viewer" ? "selected" : ""} @click=${() => ctx.emit(new ChangeView("viewer"))}><i class="material-icons">preview</i></button>
            </div>
        </div>`
}