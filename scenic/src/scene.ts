import { Point, XY } from "./core"
import { Style } from "./style"

/**
 * `Paintable` defines the interface for elements that can be repainted on a `<canvas>` element. The element
 * should repaint itself using (0, 0) as the reference. A context translation as well as scaling has been
 * applied before.
 */
export interface Paintable {
    repaint(ctx: CanvasRenderingContext2D): void
}

export type PositionedPaintableOptions = Paintable | PositionedPaintable | [Point | XY, Paintable]

export class PositionedPaintable {
    static create(opts: PositionedPaintableOptions): PositionedPaintable {
        if (opts instanceof PositionedPaintable) {
            return opts
        }

        if (Array.isArray(opts)) {
            return new PositionedPaintable(Point.create(opts[0]), opts[1])
        }

        return new PositionedPaintable(Point.origin, opts)
    }

    constructor(readonly at: Point, readonly p: Paintable) { }

    repaint(ctx: CanvasRenderingContext2D): void {
        try {
            ctx.save()
            ctx.translate(this.at.x, this.at.y)
            this.p.repaint(ctx)
        } finally {
            ctx.restore()
        }
    }
}

export interface SceneElementOptions {
    id?: string
    at: Point | XY
    outline?: Path2D | null
    movable?: boolean
    paintables: Array<PositionedPaintableOptions> | PositionedPaintableOptions
}

export class SceneElement {
    static create(opts: SceneElementOptions): SceneElement {
        if (!Array.isArray(opts.paintables)) {
            opts.paintables = [ opts.paintables ]
        }
        return new SceneElement(
            opts.id ?? randomId(),
            Point.create(opts.at),
            opts.outline ? true : false,
            opts.movable ?? false,
            false,
            opts.outline ?? null,
            (opts.paintables as Array<PositionedPaintableOptions>).map(PositionedPaintable.create),
        )
    }

    constructor(
        public readonly id: string,
        public at: Point,
        public selectable: boolean,
        public movable: boolean,
        public selected: boolean,
        public outline: Path2D | null,
        public paintables: Array<PositionedPaintable>,
    ) { }

    repaint(ctx: CanvasRenderingContext2D, selectionStyle: Style): void {
        try {
            ctx.save()
            ctx.translate(this.at.x, this.at.y)
            this.paintables.forEach(p => p.repaint(ctx))

            if (this.selected && this.outline) {
                selectionStyle.prepare(ctx)
                ctx.stroke(this.outline)
            }
        } finally {
            ctx.restore()
        }
    }

    contains(ctx: CanvasRenderingContext2D, p: Point): boolean {
        if (!this.outline) {
            return false
        }

        const pt = p.translate(-this.at.x, -this.at.y)
        return ctx.isPointInPath(this.outline, pt.x, pt.y)
    }
}

export class Layer {
    public readonly elements: Array<SceneElement>

    constructor(
        public readonly id: string,
        ...elements: Array<SceneElement>) {
        this.elements = elements
    }

    repaint(ctx: CanvasRenderingContext2D, selectionStyle: Style): void {
        this.elements.forEach(s => {
            s.repaint(ctx, selectionStyle)
        })
    }

    firstHit(ctx: CanvasRenderingContext2D, p: Point): SceneElement | null {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            if (this.elements[i].selectable && this.elements[i].contains(ctx, p)) {
                return this.elements[i]
            }
        }

        return null
    }

    get selected(): Array<SceneElement> {
        return this.elements.filter(l => l.selected)
    }

    unselectAll(): void {
        this.elements.forEach(e => e.selected = false)
    }

    findElement(id: string): SceneElement | null {
        return this.elements.find(e => e.id === id) ?? null
    }
}

export class Scene {
    public readonly layers: Array<Layer>

    constructor(...layers: Array<Layer>) {
        this.layers = layers
    }

    findElement(id: string): SceneElement | null {
        for (var l of this.layers) {
            const e = l.findElement(id)
            if (e !== null) {
                return e
            }
        }

        return null
    }

    findLayer(id: string): Layer | null {
        return this.layers.find(l => l.id === id) ?? null
    }

    repaint(ctx: CanvasRenderingContext2D, selectionStyle: Style): void {
        this.layers.forEach(l => l.repaint(ctx, selectionStyle))
    }

    firstHit(ctx: CanvasRenderingContext2D, p: Point): SceneElement | null {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const e = this.layers[i].firstHit(ctx, p)
            if (e !== null) {
                return e
            }
        }

        return null
    }

    get selected(): Array<SceneElement> {
        return this.layers.reduce((p: Array<SceneElement>, l: Layer) => p.concat(l.selected), [])
    }

    unselectAll(): void {
        this.layers.forEach(l => l.unselectAll())
    }
}

const IdAlphabet = "abcdefghijklmnopqrstuvwxyz_-$"
const IdLength = 16

export function randomId(): string {
    let id = ""
    for (let i = 0; i < IdLength; ++i) {
        id += IdAlphabet.charAt(Math.random() * IdAlphabet.length)
    }
    return id
}