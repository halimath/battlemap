import * as wecco from "@weccoframework/core"
import * as battlemap from "@halimath/battlemap"

import { update } from "./control"
import { root } from "./view"
import { Model } from "./model"

import "./index.css"

document.addEventListener("DOMContentLoaded", () => {
    const map = {
        explanations: [
            battlemap.Zone.create({
                at: [0, 0],
                size: [1000, 500],
                label: "Zone 1",
            }),
            battlemap.Zone.create({
                at: [0, 510],
                size: [1000, 500],
                label: "Zone 2",
            }),
        ],
        tokens: [
            battlemap.Token.create({
                at: [50, 50],
            }),
            battlemap.Token.create({
                at: [150, 50],
            }),
            battlemap.Token.create({
                at: [250, 50],
            }),
        ]
    }    
    wecco.app(() => new Model(map), update, root, "#app")
})