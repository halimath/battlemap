import { Style } from "./style"
import { Bounds, Point, XY } from "./core"

export interface SceneElement {
    readonly id: string
    at: Point
    selectable: boolean
    movable: boolean
    selected: boolean

    draw(ctx: CanvasRenderingContext2D, selectionStyles: Style): void
    contains (ctx: CanvasRenderingContext2D, p: Point): boolean
}

export interface SceneElementGroupOptions {
    at: Point | XY
    id?: string
    selectable?: boolean
    movable?: boolean    
}

export class SceneElementGroup implements SceneElement {
    static create(opts: SceneElementGroupOptions, ...elements: Array<SceneElement>): SceneElementGroup {
        return new SceneElementGroup(
            opts.id ?? randomId(),
            Point.create(opts.at),
            opts.selectable ?? false,
            opts.movable ?? false,
            false,
            ...elements
        )
    }

    public readonly elements: Array<SceneElement>
    
    constructor(       
        public readonly id: string, 
        public at: Point,
        public selectable: boolean,
        public movable: boolean,
        public selected: boolean,
        ...elements: Array<SceneElement>
    ) {
        this.elements = elements
    }

    draw(ctx: CanvasRenderingContext2D, selectionStyles: Style): void {
        try {
            ctx.save()
            ctx.translate(this.at.x, this.at.y) 
                       
            this.elements.forEach(e => e.draw(ctx, selectionStyles))
        } finally {
            ctx.restore()
        }
    }

    contains (ctx: CanvasRenderingContext2D, p: Point): boolean {
        for (let e of this.elements) {
            if (e.contains(ctx, p)) {
                return true
            }
        }

        return false
    }

}

export abstract class BaseSceneElement implements SceneElement {
    public selected = false

    protected constructor(
        public id: string,
        public at: Point,
        public selectable: boolean,
        public movable: boolean,
    ) {}

    draw(ctx: CanvasRenderingContext2D, selectionStyles: Style): void {
        try {
            ctx.save()
            ctx.translate(this.at.x, this.at.y)

            const selectionBounds = this.drawTranslated(ctx)
            
            if (this.selected) {
                if (!selectionBounds) {
                    console.error(`Invalid state: selected element does not provide selectionBounds: ${this}`)
                    return
                }
            
                selectionStyles.prepare(ctx)

                const b = selectionBounds.resize(10)
                ctx.strokeRect(b.upperLeft.x, b.upperLeft.y, b.width, b.height)
            }        
        } finally {
            ctx.restore()
        }
    } 

    protected abstract drawTranslated (ctx: CanvasRenderingContext2D): Bounds | null

    abstract contains (ctx: CanvasRenderingContext2D, p: Point): boolean
}

export class Layer {
    public readonly elements: Array<SceneElement>

    constructor(
        public readonly id: string,
        ...elements: Array<SceneElement>) {
        this.elements = elements
    }

    draw(ctx: CanvasRenderingContext2D, selectionStyle: Style): void {
        this.elements.forEach(s => {
            s.draw(ctx, selectionStyle)
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

    findLayer (id: string): Layer | null {
        return this.layers.find(l => l.id === id) ?? null
    }

    draw(ctx: CanvasRenderingContext2D, selectionStyle: Style): void {
        this.layers.forEach(l => l.draw(ctx, selectionStyle))
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