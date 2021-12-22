import * as wecco from "@weccoframework/core"
import * as battlemap from "@halimath/battlemap"

import { Model, View } from "./model"

export class ChangeView {
    readonly command = "change-view"

    constructor (readonly view: View) {}
}

export class Reset {
    readonly command = "reset"
}

export class BattleMapUpdated {
    readonly command = "battleMap-updated"

    constructor (readonly battleMap: battlemap.BattleMap) {}
}

export type Message = ChangeView | Reset | BattleMapUpdated

export function update(model: Model, msg: Message): Model | typeof wecco.NoModelChange {
    switch (msg.command) {
        case "reset":
            return new Model({}, "editor")
        case "change-view":
            return new Model(model.battleMap, msg.view)
        case "battleMap-updated":
            return new Model(msg.battleMap, model.view)
    }
    
    return wecco.NoModelChange
}