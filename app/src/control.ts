import * as wecco from "@weccoframework/core"
import * as battlemap from "@halimath/battlemap"
import { Model } from "./model"

export class BattleMapUpdated {
    readonly command = "battleMap-updated"

    constructor (readonly battleMap: battlemap.BattleMap) {}
}

export class ViewportChanged {
    readonly command = "viewport-changed"

    constructor (readonly viewport: battlemap.Viewport) {}
}

export type Message =  BattleMapUpdated | ViewportChanged 

export function update(model: Model, msg: Message): Model | typeof wecco.NoModelChange {    
    switch (msg.command) {
        case "battleMap-updated":
            return notify(new Model(model.type, model.id, msg.battleMap, model.viewport, model.ws))
        case "viewport-changed":
            return new Model(model.type, model.id, model.battleMap, msg.viewport, model.ws)
    }
}

function notify(m: Model): Model {
    m.ws.send(battlemap.marshalBattleMap(m.battleMap))
    return m
}