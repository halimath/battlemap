import * as battlemap from "@halimath/battlemap"

export type View = "editor" | "viewer"

export class Model {
    static editor(): Model {
        const id = randomId()
        return new Model("editor", id, {}, new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/edit/${id}`))
    }

    static join(id: string): Model {
        return new Model("viewer", id, {}, new WebSocket(`ws${document.location.protocol.substring(4)}//${document.location.host}/view/${id}`))
    }

    constructor(
        readonly view: View,
        readonly id: string,
        readonly battleMap: battlemap.BattleMap,
        readonly ws: WebSocket,
    ) { }

    get shareUrl(): string {
        return `${document.location.protocol}//${document.location.host}/join/${this.id}`
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