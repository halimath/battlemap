import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { BattleMapUpdated, update } from "./control"
import "./index.css"
import { Model } from "./model"
import { showNotification } from "./notification"
import { root } from "./view"


document.addEventListener("DOMContentLoaded", () => {
    if (document.location.pathname.startsWith("/view/")) {        
        const model = Model.join(document.location.pathname.substring("/view/".length))
        const ctx = wecco.app(() => model, update, root, "#app")

        model.ws.addEventListener("message", msg => {
            try {
                ctx.emit(new BattleMapUpdated(battlemap.unmarshalBattleMap(msg.data)))
            } catch (e) {
                console.error(e)
            }
        })
        model.ws.addEventListener("close", () => {
            showNotification("The editor closed the map.")
        })
        
        return
    }

    if (document.location.pathname.startsWith("/edit/")) {
        wecco.app(() => Model.editor(document.location.pathname.substring("/edit/".length)), update, root, "#app")
        return
    }

    const model = Model.editor()
    history.pushState(null, "", `/edit/${model.id}`)
    wecco.app(() => model, update, root, "#app")
})
