import * as battlemap from "@halimath/battlemap"

export type View = "editor" | "viewer"

export class Model {
    constructor (
        public battleMap: battlemap.BattleMap,
        public view: View = "editor",
    ) {}
}