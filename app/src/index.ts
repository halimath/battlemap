import * as battlemap from "@halimath/battlemap"
import * as wecco from "@weccoframework/core"
import { showNotification } from "./notification"

import "material-icons/iconfont/material-icons.css"
import "./index.css"
import { ApiClient, BattleMap as BattleMapDto, Drawing, Token, Zone } from "../generated"

document.addEventListener("DOMContentLoaded", async () => {
    let apiClient = new ApiClient({
        BASE: "/api",
    })

    let id: string

    const init = async (viewer: boolean, evt: CustomEvent) => {
        const editor = evt.target as wecco.WeccoElement<battlemap.EditorData>

        if (viewer) {
            const fetchUpdate = async () => {
                const dto = await apiClient.battleMap.getBattleMap({
                    id: id
                })
                const map = fromDto(dto)
                editor.setData(map)
            }

            setInterval(fetchUpdate, 5000)
            fetchUpdate()
        } else {
            editor.addEventListener(battlemap.BattleMapUpdatedEvent, (evt: Event) => {
                apiClient.battleMap.updateBattleMap({
                    id: id,
                    requestBody: toDto(id, (evt as CustomEvent).detail as battlemap.BattleMap)
                })
            })

            try {
                const dto = await apiClient.battleMap.getBattleMap({
                    id: id
                })
                const map = fromDto(dto)
                editor.setData(map)
            } catch (e) {
                apiClient.battleMap.updateBattleMap({
                    id: id,
                    requestBody: toDto(id, {})
                })
            }
        }
    }

    if (document.location.pathname.startsWith("/view/")) {
        id = document.location.pathname.substring("/view/".length)

        wecco.updateElement("#app", wecco.html`
            ${appbar(id, false)}
            <battlemap-viewer @update=${init.bind(null, true)}></battlemap-viewer>
        `)
    } else if (document.location.pathname.startsWith("/edit/")) {
        id = document.location.pathname.substring("/edit/".length)
        apiClient = await authorize()

        wecco.updateElement("#app", wecco.html`
            ${appbar(id, true)}
            <battlemap-editor @update=${init.bind(null, false)}></battlemap-editor>
        `)
    } else {
        document.location.href = `/edit/${randomId()}`
        return
    }
})

const AuthTokenSessionStorageKey = "auth-token"

async function authorize(): Promise<ApiClient> {
    let authToken = sessionStorage.getItem(AuthTokenSessionStorageKey)
    let apiClient: ApiClient

    if (authToken !== null) {
        apiClient = new ApiClient({
            BASE: "/api",
            TOKEN: authToken,
            CREDENTIALS: "include",
            WITH_CREDENTIALS: true,
        })
    } else {
        apiClient = new ApiClient({
            BASE: "/api",
        })
    }

    const token = await apiClient.authorization.createAuthToken()
    sessionStorage.setItem(AuthTokenSessionStorageKey, token)

    return new ApiClient({
        BASE: "/api",
        TOKEN: token,
        CREDENTIALS: "include",
        WITH_CREDENTIALS: true,
    })
}

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

function toDto(id: string, m: battlemap.BattleMap): BattleMapDto {
    return {
        id: id,
        grid: m.grid ?? false,
        drawings: m.drawings?.map(drawingToDto) ?? [],
        zones: m.zones?.map(zoneToDto) ?? [],
        tokens: m.tokens?.map(tokenToDto) ?? [],
    }
}

function drawingToDto(shape: battlemap.Drawing): Drawing {
    return {
        id: shape.id,
        at: [shape.at.x, shape.at.y],
        points: shape.points.map(p => [p.x, p.y]),
    }
}

function zoneToDto(shape: battlemap.Zone): Zone {
    return {
        id: shape.id,
        at: [shape.at.x, shape.at.y],
        size: [shape.size.x, shape.size.y],
        label: shape.label,
    }
}

function tokenToDto(shape: battlemap.Token): Token {
    return {
        id: shape.id,
        at: [shape.at.x, shape.at.y],
        color: shape.color.toHex(),
    }
}

function fromDto(dto: BattleMapDto): battlemap.BattleMap {
    return {
        grid: dto.grid,
        drawings: dto.drawings.map(drawingFromDto),
        zones: dto.zones.map(zoneFromDto),
        tokens: dto.tokens.map(tokenFromDto),
    }
}

function drawingFromDto(dto: Drawing): battlemap.Drawing {
    return battlemap.Drawing.create({
        id: dto.id,
        at: dto.at as [number, number],
        points: dto.points as Array<[number, number]>,
    })
}

function zoneFromDto(dto: Zone): battlemap.Zone {
    return battlemap.Zone.create({
        id: dto.id,
        at: dto.at as [number, number],
        size: dto.size as [number, number],
        label: dto.label,
    })
}

function tokenFromDto(dto: Token): battlemap.Token {
    return battlemap.Token.create({
        id: dto.id,
        at: dto.at as [number, number],
        color: dto.color,
    })
}
