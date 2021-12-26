import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { Message, BattleMapUpdated } from "./control"
import { Model } from "./model"
import { showNotification } from "./notification"

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

function copyShareLink(model: Model, evt: Event) {
    evt.preventDefault()
    evt.stopPropagation()
    evt.stopImmediatePropagation()
    
    navigator.clipboard.writeText(model.shareUrl)
    showNotification("Url to join the map has been copied to your clipboard.")
}

function appbar(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    const actions = model.view === "editor" ? wecco.html`        
        <button @click=${copyShareLink.bind(null, model)}><i class="material-icons">share</i></button>
    ` : ""

    return wecco.html`
        <div class="bg-sky-600 text-white p-4 mb-1 shadow-md font-sans flex justify-between">
            <div class="grow-[1]">
                <span class="text-lg font-bold">Battle Map</span>
                <a href="${model.shareUrl}">${model.id}</span>

            </div>
            <div class="flex align-end">
                ${actions}
            </div>
        </div>`
}