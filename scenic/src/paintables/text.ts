import { Paintable } from "../scene"
import { Style, StyleOptions } from "../style"

export type TextAlign = "start" | "end" | "left" | "right" | "center"
export type TextDirection = "ltr" | "rtl"

export interface TextOptions {
    text: string
    style?: StyleOptions
}

export class Text implements Paintable {
    static create(opts: TextOptions): Text {
        opts.style = Object.assign({}, opts.style ?? {})
        opts.style.fillStyle = opts.style.fillStyle ?? opts.style.strokeStyle ?? "black"

        return new Text(
            opts.text,
            Style.create(opts.style),
        )
    }

    constructor(
        public text: string,
        public style: Style,
    ) { }

    repaint(ctx: CanvasRenderingContext2D): void {
        this.style.prepare(ctx)

        if (this.style.fillStyle) {
            ctx.fillText(this.text, 0, 0)
        } else {
            ctx.strokeText(this.text, 0, 0)
        }
    }
}