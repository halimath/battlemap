export type XY = [number, number] | [number] | number

export class Dimension {
    public readonly y: number

    static create(p: Dimension | XY): Dimension {
        if (p instanceof Dimension) {
            return p
        }

        if (Array.isArray(p)) {
            return new Dimension(p[0], p.length > 1 ? p[1] : p[0])
        }

        return new Dimension(p, p)
    }

    static fromOrigin(p: Point): Dimension {
        return new Dimension(p.x, p.y)
    }

    constructor(public readonly x: number, y?: number) {
        this.y = y ?? x
    }

    get length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    diff(d: number): Dimension {
        return new Dimension(this.x / d, this.y / d)
    }

    toString(): string {
        return `|${this.x}, ${this.y}|`
    }
}

export class Point {
    static get origin(): Point {
        return new Point(0, 0)
    }

    static create(p: Point | XY): Point {
        if (p instanceof Point) {
            return p
        }

        if (Array.isArray(p)) {
            return new Point(p[0], p.length > 1 ? p[1] : p[0])
        }

        return new Point(p, p)
    }

    static fromMouseEvent(evt: MouseEvent) {
        return new Point(evt.offsetX, evt.offsetY)
    }

    static fromTouchEvent(evt: TouchEvent) {
        if (evt.touches.length === 0) {
            throw "empty touches"
        }
        
        const bcr = (evt.target as HTMLElement).getBoundingClientRect()

        return new Point(evt.touches[0].clientX - bcr.left, evt.touches[0].clientY - bcr.top)
    }

    public readonly y: number

    constructor(public readonly x: number, y?: number) {
        this.y = y ?? x
    }

    diff(other: Point): Dimension {
        return new Dimension(other.x - this.x, other.y - this.y)
    }

    move(v: Dimension) {
        return this.translate(v.x, v.y)
    }

    translate(dx: number, dy: number): Point {
        return new Point(this.x + dx, this.y + dy)
    }

    isSame(p: Point): boolean {
        return this.x === p.x && this.y === p.y
    }

    toString(): string {
        return `(${this.x}, ${this.y})`
    }
}

export class Bounds {
    static create(upperLeft: Point | XY, lowerRight: Point | XY): Bounds {
        return new Bounds(Point.create(upperLeft), Point.create(lowerRight))
    }

    constructor(public readonly upperLeft: Point, public readonly lowerRight: Point) { }

    contains(p: Point): boolean {
        return this.upperLeft.x <= p.x &&
            this.upperLeft.y <= p.y &&
            this.lowerRight.x >= p.x &&
            this.lowerRight.y >= p.y
    }

    get width(): number {
        return this.lowerRight.x - this.upperLeft.x
    }

    get height(): number {
        return this.lowerRight.y - this.upperLeft.y
    }

    resize(deltaX: number, deltaY?: number): Bounds {
        if (typeof deltaY === "undefined") {
            deltaY = deltaX
        }

        return new Bounds(
            this.upperLeft.move(new Dimension(-deltaX / 2, -deltaY / 2)),
            this.lowerRight.move(new Dimension(deltaX / 2, deltaY / 2)),
        )
    }

    toString(): string {
        return `[${this.upperLeft} => ${this.lowerRight}]`
    }

    move(v: Dimension): Bounds {
        return new Bounds(this.upperLeft.move(v), this.lowerRight.move(v))
    }
}

const ScaleDelta = 0.1
const MinScale = 0.01
const MaxScale = 10.0

export interface ViewportOptions {
    origin: Point | XY,
    scale?: number
}

export class Viewport {
    static initial(): Viewport {
        return new Viewport(Point.origin, 1)
    }

    static create(opts: ViewportOptions): Viewport {
        return new Viewport(Point.create(opts.origin), opts.scale ?? 1.0)
    }

    constructor(
        public readonly origin: Point,
        public readonly scale: number = 1.0,
    ) { }

    zoomOut(): Viewport {
        if (this.scale <= MinScale) {
            return this
        }

        return new Viewport(this.origin, this.scale - ScaleDelta)
    }

    zoomIn(): Viewport {
        if (this.scale >= MaxScale) {
            return this
        }

        return new Viewport(this.origin, this.scale + ScaleDelta)
    }

    move(v: Dimension): Viewport {
        return new Viewport(this.origin.move(v), this.scale)
    }

    applyTranspose(ctx: CanvasRenderingContext2D) {
        ctx.translate(this.origin.x, this.origin.y)
        ctx.scale(this.scale, this.scale)
    }

    toCoordinateSpace(p: Point): Point {
        return new Point(
            (p.x - this.origin.x) / this.scale,
            (p.y - this.origin.y) / this.scale,
        )
    }
}
