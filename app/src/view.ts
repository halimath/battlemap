import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { Message, BattleMapUpdated, ViewportChanged } from "./control"
import { Model } from "./model"
import { showNotification } from "./notification"

export function root(model: Model, ctx: wecco.AppContext<Message>): wecco.ElementUpdate {
    let component: wecco.WeccoElement<any>
    
    if (model.type === "viewer") {
        component = battlemap.Viewer({
            background: model.battleMap.background,
            explanations: model.battleMap.explanations,
            tokens: model.battleMap.tokens,
            viewport: model.viewport,
        })

        history.pushState(null, "", `/view/${model.id}`)
    } else {
        component = battlemap.Editor({
            background: model.battleMap.background,
            explanations: model.battleMap.explanations,
            tokens: model.battleMap.tokens,
            viewport: model.viewport,
        })
        component.addEventListener(battlemap.BattleMapUpdatedEvent, (evt: Event) => {
            ctx.emit(new BattleMapUpdated((evt as CustomEvent).detail as battlemap.BattleMap))
        })

        history.pushState(null, "", `/edit/${model.id}`)
    }

    component.addEventListener(battlemap.ViewportChangedEvent, evt => {
        ctx.emit(new ViewportChanged((evt as CustomEvent).detail as battlemap.Viewport))
    })

    return wecco.html`
        ${appbar(model)}
        ${component}
    `
}

function copyShareLink(model: Model, evt: Event) {
    evt.preventDefault()
    evt.stopPropagation()
    evt.stopImmediatePropagation()
    
    navigator.clipboard.writeText(model.shareUrl)
    showNotification("Url to join the map has been copied to your clipboard.")
}

function appbar(model: Model): wecco.ElementUpdate {
    const actions = model.type === "editor" ? wecco.html`        
        <button @click=${copyShareLink.bind(null, model)}><i class="material-icons">share</i></button>
    ` : ""

    return wecco.html`
        <div class="bg-sky-600 text-white p-4 shadow-md font-sans flex justify-between">
            <div class="grow-[1]">
                <span class="text-lg font-bold">Battle Map</span>
                <a href="${model.shareUrl}">${model.id}</span>

            </div>
            <div class="flex align-end">
                ${actions}
            </div>
        </div>`
}