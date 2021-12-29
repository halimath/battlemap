import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { showNotification } from "./notification"
import "./index.css"

document.addEventListener("DOMContentLoaded", () => {
    let id: string
    let ws: WebSocket

    const init = (evt: CustomEvent) => {
        const editor = evt.target as wecco.WeccoElement<battlemap.EditorData>

        editor.addEventListener(battlemap.BattleMapUpdatedEvent, (evt: Event) => {
            ws.send(battlemap.marshalBattleMap((evt as CustomEvent).detail as battlemap.BattleMap))
        })

        ws.addEventListener("message", msg => {
            try {
                const map = battlemap.unmarshalBattleMap(msg.data)
                editor.setData(map)                
            } catch (e) {
                console.error(e)
            }
        })        
    }        

    if (document.location.pathname.startsWith("/view/")) {        
        id = document.location.pathname.substring("/view/".length)
        ws = new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/ws/view/${id}`)

        wecco.updateElement("#app", wecco.html`
            ${appbar(id, false)}
            <battlemap-viewer @update=${init}></battlemap-viewer>
        `)        
    } else if (document.location.pathname.startsWith("/edit/")) {
        id = document.location.pathname.substring("/edit/".length)
        ws = new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/ws/edit/${id}`)

        wecco.updateElement("#app", wecco.html`
            ${appbar(id, true)}
            <battlemap-editor @update=${init}></battlemap-editor>
        `)        

    } else {
        document.location.href = `/edit/${randomId()}`
        return
    }

    ws.addEventListener("close", () => {
        showNotification("The editor closed the map.")
    })    
})

function copyShareLink(id: string, evt: Event) {
    evt.preventDefault()
    evt.stopPropagation()
    evt.stopImmediatePropagation()
    
    navigator.clipboard.writeText(shareUrl(id))
    showNotification("Url to join the map has been copied to your clipboard.")
}

function shareUrl(id: string): string {
    return `${document.location.protocol}//${document.location.host}/view/${id}`
}

function appbar(id: string, edit: boolean): wecco.ElementUpdate {
    const actions = edit ? wecco.html`        
        <button @click=${copyShareLink.bind(null, id)}><i class="material-icons">share</i></button>
    ` : ""

    return wecco.html`
        <div class="bg-sky-600 text-white p-4 shadow-md font-sans flex justify-between">
            <div class="grow-[1]">
                <span class="text-lg font-bold">Battle Map</span>
                ${id}
            </div>
            <div class="flex align-end">
                ${actions}
            </div>
        </div>`
}

const IdAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const IdLength = 8

function randomId(): string {
    let id = ""
    for (let i = 0; i < IdLength; ++i) {
        id += IdAlphabet.charAt(Math.random() * IdAlphabet.length)
    }
    return id
}
