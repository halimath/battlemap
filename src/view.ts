import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { Message, ChangeView } from "./control"
import { Model } from "./model"

export function root(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    return [
        appbar(model, ctx),
        model.view === "editor" ? battlemap.BattleMapEditor(model.battleMap) : battlemap.BattleMapViewer(model.battleMap),
    ]
}

function appbar(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    return wecco.html`
        <div class="bg-sky-600 text-white p-4 mb-1 shadow-md font-sans flex justify-between">
            <div class="grow-[1]">
                <span class="text-lg font-bold">Battle Map</span>
            </div>
            <div class="grow-[4]">
                <button class=${model.view === "editor" ? "selected" : ""} @click=${() => ctx.emit(new ChangeView("editor"))}><i class="material-icons">edit</i></button>
                <button class=${model.view === "viewer" ? "selected" : ""} @click=${() => ctx.emit(new ChangeView("viewer"))}><i class="material-icons">preview</i></button>
            </div>
        </div>`
}