import { Paintable } from "../scene"

export interface ImageOptions {
    src: CanvasImageSource
}

export class Image implements Paintable {
    static create(opts: ImageOptions): Image {
        return new Image(
            opts.src,
        )
    }

    constructor(
        public readonly src: CanvasImageSource,
    ) { }

    repaint(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.src, 0, 0)
    }
}