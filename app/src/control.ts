import * as wecco from "@weccoframework/core"
import * as battlemap from "@halimath/battlemap"
import { showNotification } from "./notification"
import { Model } from "./model"

export class BattleMapUpdated {
    readonly command = "battleMap-updated"

    constructor (readonly battleMap: battlemap.BattleMap) {}
}

export class Join {
    readonly command = "join"

    constructor (readonly id: string) {}
}

export type Message =  BattleMapUpdated | Join

export function update(model: Model, msg: Message, ctx: wecco.AppContext<Message>): Model | typeof wecco.NoModelChange {
    switch (msg.command) {
        case "battleMap-updated":
            return notify(new Model(model.view, model.id, msg.battleMap, model.ws))
        case "join":
            return join(msg.id, ctx)
    }
}

function join(id: string, ctx: wecco.AppContext<Message>): Model {
    const m = Model.connect(id, "viewer")
    m.ws.addEventListener("message", msg => {
        try {
            ctx.emit(new BattleMapUpdated(battlemap.unmarshalBattleMap(msg.data)))
        } catch (e) {
            console.error(e)
        }
    })
    m.ws.addEventListener("close", () => {
        showNotification("The editor closed the map.")
    })

    return m
}

function notify(m: Model): Model {
    m.ws.send(battlemap.marshalBattleMap(m.battleMap))
    return m
}