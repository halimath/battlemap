import { Dimension, Bounds, Point, XY } from "../core"
import { BaseSceneElement, randomId } from "../scene"
import { Style, StyleOptions } from "../style"

export type TextAlign = "start" | "end" | "left" | "right" | "center"
export type TextDirection = "ltr" | "rtl"

export interface TextOptions extends StyleOptions {
    id?: string
    at: Point | XY
    selectable?: boolean
    movable?: boolean
    text: string
    fontSize?: number
    fontFamily?: string
    textAlign?: TextAlign
    direction?: TextDirection
}

export class Text extends BaseSceneElement {
    static create(opts: TextOptions): Text {
        opts.fillStyle = opts.fillStyle ?? "black"

        return new Text(
            opts.id ?? randomId(),
            Point.create(opts.at),
            opts.selectable ?? false,
            opts.movable ?? false,
            opts.text,
            `${opts.fontSize ?? 10}pt ${opts?.fontFamily ?? "sans-serif"}`,
            opts.textAlign ?? "start",
            opts.direction ?? "ltr",
            Style.create(opts),
        )
    }

    private selectionBounds: Bounds | null = null

    constructor(
        id: string,
        at: Point,
        selectable: boolean,
        movable: boolean,
        public text: string,
        public font: string,
        public textAlign: TextAlign,
        public direction: TextDirection,
        public style: Style,
    ) { 
        super(id, at, selectable, movable)
    }

    protected drawTranslated (ctx: CanvasRenderingContext2D): Bounds | null {
        this.style.prepare(ctx)

        ctx.font = this.font
        ctx.textAlign = this.textAlign
        ctx.direction = this.direction
        
        if (this.style.fillStyle) {   
            ctx.fillText(this.text, 0, 0)
        } else {
            ctx.strokeText(this.text, 0, 0)
        }

        const metrics = ctx.measureText(this.text)

        this.selectionBounds = new Bounds(
            new Point(
                0,
                -metrics.actualBoundingBoxAscent,
            ),
            new Point(
                metrics.width,
                metrics.actualBoundingBoxDescent,
            ),
        )

        return this.selectionBounds
    }

    contains (ctx: CanvasRenderingContext2D, p: Point): boolean {
        return this.selectionBounds?.move(Dimension.fromOrigin(this.at)).contains(p) ?? false
    }
}