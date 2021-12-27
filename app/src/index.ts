import * as wecco from "@weccoframework/core"
import { update, Join } from "./control"
import { Model } from "./model"
import { root } from "./view"

import "./index.css"

document.addEventListener("DOMContentLoaded", () => {
    const ctx = wecco.app(Model.editor, update, root, "#app")

    if (document.location.pathname.startsWith("/join/")) {
        ctx.emit(new Join(document.location.pathname.substring("/join/".length)))
    }
})