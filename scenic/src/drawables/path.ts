import { BaseSceneElement, randomId } from "../scene"
import { Point, Bounds, XY, Dimension } from "../core"
import { Style, StyleOptions } from "../style"

export interface PathBaseOptions extends StyleOptions {
    id?: string
    at: Point | XY
    closed?: boolean
    movable?: boolean
}

export interface PathOptions extends PathBaseOptions {    
    d: Array<Point | XY | number> | Path2D | string
    selectionBounds?: Bounds | null
}

export interface RectangleOptions extends PathBaseOptions {
    size: Dimension | XY
    selectable?: boolean
}

export interface EllipseOptions extends PathBaseOptions {
    size: Dimension | XY
    selectable?: boolean
    startAngle?: number
    endAngle?: number
    rotation?: number
}

export class Path extends BaseSceneElement {
    static rectangle (opts: RectangleOptions): Path {
        const dim = Dimension.create(opts.size)
        const pathOpts: PathOptions = {
            id: opts.id,
            at: opts.at,
            d: [0, [0, dim.y], [dim.x, dim.y], [dim.x, 0]],
            closed: true,
            movable: opts.movable,
            selectionBounds: opts.selectable ? new Bounds(Point.origin, new Point(dim.x, dim.y)) : null,
        }

        Style.copyOptions(opts, pathOpts)
        
        return this.create(pathOpts)
    }

    static ellipse (opts: EllipseOptions): Path {
        const dim = Dimension.create(opts.size)

        const p = new Path2D()
        p.ellipse(
            dim.x / 2, 
            dim.y / 2, 
            dim.x / 2, 
            dim.y / 2, 
            opts.rotation ?? 0,
            opts.startAngle ?? 0,
            opts.endAngle ?? 2 * Math.PI
        )

        const pathOpts: PathOptions = {
            id: opts.id,
            at: opts.at,
            d: p,
            closed: true,
            movable: opts.movable,
            selectionBounds: opts.selectable ? new Bounds(Point.origin, new Point(dim.x, dim.y)) : null,
        }
        Style.copyOptions(opts, pathOpts)

        return this.create(pathOpts)
    }

    static create(opts: PathOptions): Path {
        let path: Path2D

        if (Array.isArray(opts.d)) {
            path = new Path2D()
            const points = opts.d.map(Point.create)
            path.moveTo(points[0].x, points[0].y)
            points.slice(1).forEach(p => {
                path.lineTo(p.x, p.y)
            })
            if (opts.closed) {
                path.closePath()
            }

        } else if (typeof opts.d === "string") {
            path = new Path2D(opts.d)
        } else {
            path = opts.d
        }

        return new Path(
            opts.id ?? randomId(),
            Point.create(opts.at),
            path,
            opts.closed ?? false,
            Style.create(opts),
            opts.selectionBounds ?? null,
            opts.movable ?? false,
        )
    }

    constructor (
        id: string,
        at: Point,
        public readonly path: Path2D, 
        public readonly closed: boolean,
        public readonly style: Style,
        private readonly selectionBounds: Bounds | null, 
        movable: boolean,
        ) {
            super(id, at, !!selectionBounds, movable)
        }

    drawTranslated(ctx: CanvasRenderingContext2D): Bounds | null {
        this.style.prepare(ctx)        

        if (this.style.fillStyle) {
            ctx.fill(this.path)
        }

        if (this.style.strokeStyle) {
            ctx.stroke(this.path)
        }

        return this.selectionBounds
    }

    contains (ctx: CanvasRenderingContext2D, p: Point): boolean {
        return this.selectionBounds?.move(Dimension.fromOrigin(this.at)).contains(p) ?? false
    }

    // contains (ctx: CanvasRenderingContext2D, p: Point): boolean {
    //     try {
    //         ctx.save()
    //         ctx.translate(this.at.x, this.at.y)
    //         return ctx.isPointInPath(this.path, p.x, p.y)
    //     } finally {
    //         ctx.restore()
    //     }
    // }
}