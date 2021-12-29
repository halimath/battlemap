import * as battlemap from "@halimath/battlemap"

export type Type = "editor" | "viewer"

export class Model {
    static editor(id?: string): Model {
        id = id ?? randomId()
        return new Model("editor", id, {}, battlemap.Viewport.create({ origin: 5 }), new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/ws/edit/${id}`))
    }

    static join(id: string): Model {
        return new Model("viewer", id, {}, battlemap.Viewport.create({ origin: 5 }), new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/ws/view/${id}`))
    }

    constructor(
        readonly type: Type,
        readonly id: string,
        readonly battleMap: battlemap.BattleMap,
        readonly viewport: battlemap.Viewport,
        readonly ws: WebSocket,
    ) { }

    get shareUrl(): string {
        return `${document.location.protocol}//${document.location.host}/view/${this.id}`
    }
}

const IdAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const IdLength = 8

export function randomId(): string {
    let id = ""
    for (let i = 0; i < IdLength; ++i) {
        id += IdAlphabet.charAt(Math.random() * IdAlphabet.length)
    }
    return id
}