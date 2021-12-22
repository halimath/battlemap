import { Paintable } from "../scene"
import { Point, Bounds, XY, Dimension } from "../core"
import { Style, StyleOptions } from "../style"

export interface PathBaseOptions {    
    closed?: boolean
    style?: StyleOptions
}

export interface PathOptions extends PathBaseOptions {    
    d: Array<Point | XY | number> | Path2D | string
    selectionBounds?: Bounds | null
}

export interface RectangleOptions extends PathBaseOptions {
    size: Dimension | XY
}

export interface EllipseOptions extends PathBaseOptions {
    size: Dimension | XY
    startAngle?: number
    endAngle?: number
    rotation?: number
}

export class Path implements Paintable {
    static rectangle (opts: RectangleOptions): Path {
        const dim = Dimension.create(opts.size)
        const pathOpts: PathOptions = {
            d: [0, [0, dim.y], [dim.x, dim.y], [dim.x, 0]],
            closed: true,
            style: opts.style,
        }
        
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
            d: p,
            closed: true,
            style: opts.style,
        }

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
            path,
            opts.closed ?? false,
            Style.create(opts.style),
        )
    }

    constructor (
        public readonly path: Path2D, 
        public readonly closed: boolean,
        public readonly style: Style,
        ) {}

        repaint(ctx: CanvasRenderingContext2D): void {            
        this.style.prepare(ctx)        

        if (this.style.fillStyle) {
            ctx.fill(this.path)
        }

        if (this.style.strokeStyle) {
            ctx.stroke(this.path)
        }
    }
}