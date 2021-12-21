import * as wecco from "@weccoframework/core"
import { Model, View } from "./model"

export class ChangeView {
    readonly command = "change-view"

    constructor (readonly view: View) {}
}

export type Message = ChangeView

export function update(model: Model, msg: Message): Model | typeof wecco.NoModelChange {
    switch (msg.command) {
        case "change-view":
            return new Model(model.battleMap, msg.view)
    }
    
    return wecco.NoModelChange
}