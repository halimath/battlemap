import { Bounds, Point, XY } from "../core"
import { BaseSceneElement, randomId } from "../scene"

export interface ImageOptions {
    id?: string
    at: Point | XY
    src: CanvasImageSource
    selectable?: boolean
    movable?: boolean
}

export class Image extends BaseSceneElement {
    static create (opts: ImageOptions): Image {
        return new Image(
            opts.id ?? randomId(),
            Point.create(opts.at),
            opts.src,
            opts.selectable ?? false,
            opts.movable ?? false,
        )
    }

    constructor (
        id: string,
        at: Point,        
        public readonly src: CanvasImageSource, 
        selectable: boolean,
        movable: boolean,
        ) {
            super(id, at, selectable, movable)
        }

    drawTranslated(ctx: CanvasRenderingContext2D): Bounds | null {
        ctx.drawImage(this.src, 0, 0)
        
        return null
    }

    contains (ctx: CanvasRenderingContext2D, p: Point): boolean {
        // TODO: IMplement 
        return false
        // try {
        //     ctx.save()
        //     ctx.translate(this.at.x, this.at.y)
        //     return ctx.isPointInPath(this.path, p.x, p.y)
        // } finally {
        //     ctx.restore()
        // }
    }
}