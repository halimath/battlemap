import { Style } from "./style"
import { Point, Viewport } from "./core"
import { Scene } from "./scene"
import { EventEmitter } from "./eventemitter"

/**
 * `CanvasSelector` defines how to select a `HTMLCanvasElement` either using
 * a selector or by providing the element itself.
 */
export type CanvasSelector = HTMLCanvasElement | string

/**
 * Resolves the selector returning the selected `<canvas>` element
 * or throws an exception.
 * @param s the selector
 * @returns the `HTMLCanvasElement`
 */
function resolve(s: CanvasSelector): HTMLCanvasElement {
    if (typeof s !== "string") {
        return s
    }

    const e = document.querySelector(s)
    
    if (e === null) {
        throw `No such canvas element: ${s}`
    }
    
    if (!(e instanceof HTMLCanvasElement)) {
        throw `Not a canvas element: ${e}`
    }

    return e
}

/**
 * `DrawingMode` defines how drawing on a canvas should be handled. The system either draws a rect from start, to end,
 * follows the movement by drawing a poly-gon or drawing is disabled.
 */
export type DrawingMode = "rect" | "poly" | null

/**
 * `ScenicOptions` defines the options passed to `Scenic.create` that initialize a `Scenic` to use.
 */
export interface ScenicOptions {
    /** Defines the `<canvas>` to use */
    canvas: CanvasSelector
    /** Defines the elements that should be drawn */
    scene: Scene
    /** Should the canvas reflect changes in size (such as window resizing or rotation changes) */
    resize?: boolean
    /** Should the scenic respond to zoom requests */
    zoom?: boolean
    /** Should the scenic support element selection */
    select?: boolean
    /** Should the scenic support movement - either the whole scene or selected elements */
    move?: boolean
    /** The drawing mode */
    drawingMode?: DrawingMode
    /** The viewport to use */
    viewport?: Viewport
}

/**
 * `EventName` defines the events that a `Scenic` emits to report user interactions.
 */
export type EventName = "selectionChanged" | "viewportChanged" | "sceneUpdated" | "drawingFinished"

/**
 * `ScenicEvent` describes the core properties sent with every event.
 */
export interface ScenicEvent {
    eventName: EventName
    source: Scenic
}

/**
 * `DrawingFinishedEvent` defines the event's payload structure used to report when a user finished drawing.
 */
export interface DrawingFinishedEvent extends ScenicEvent {
    path: Path2D
    start: Point
    end: Point
    mode: DrawingMode
}

/**
 * `EventListener` defines the interface for event listeners.
 * @param T defines the respective event payload type.
 */
export interface EventListener<T extends ScenicEvent> {
    (evt: T): void
}

/**
 * `Scenic` provides an use interaction centric handler for a `<canvas>` element. It paints a `Scene` which
 * can contain multiple `SceneElements` on different `Layers`. It handles user input events by subscribing to
 * several different event types and adjusts and repaints the canvas accordingly.
 * 
 * Any user interaction is report using the high-level events defined above.
 */
export class Scenic {
    /**
     * `forCanvas` looks up any previously create `Scenic` that is bound to the given `<canvas>` and returns
     * it, or `null` if no `Scenic` exists for the given canvas.
     * @param selector the selector to resolve for a `<canvas>`
     * @returns the `Scenic` instance or `null`
     */
    static forCanvas(selector: CanvasSelector): Scenic | null {
        const canvas = resolve(selector)

        if ((canvas as any)._scenic) {
            return ((canvas as any)._scenic as Scenic)
        }

        return null
    }

    /**
     * `create` creates a new `Scenic` for the selected `<canvas>` and connects it with that canvas. Any
     * previously connected `Scenic` for the selected `<canvas>` will be disconnected and will not respond to
     * user interaction anymore, though it may still be able to repaint the canvas, thus causing unexpected
     * renderings. It is up to the user to ensure, that no more than one instance of `Scenic` is used to
     * interact with a single `<canvas>`.
     * 
     * @param opts the options used to create the `Scenic`
     * @returns the `Scenic` instance
     */
    static create(opts: ScenicOptions): Scenic {
        const canvas = (typeof opts.canvas === "string") ?
            document.querySelector(opts.canvas) as HTMLCanvasElement :
            opts.canvas

        const s = new Scenic(
            canvas,
            opts.scene,
            opts.resize ?? false,
            opts.zoom ?? false,
            opts.select ?? false,
            opts.move ?? false,
            opts.drawingMode ?? null,
            opts.viewport,
        )

        if ((canvas as any)._scenic) {
            ((canvas as any)._scenic as Scenic).disconnect()
        }
        (canvas as any)._scenic = s
        s.connect()

        return s
    }

    /**
     * `selectionStyle` is used to render a selection frame. It may be updated to customize selection style.
     */
    public selectionStyle: Style = Style.create({
        strokeStyle: "#0069dba0",
        lineWidth: 2,
        shadowColor: "#0083ff",
        shadowBlur: 5,
    })

    /**
     * `drawingStyle` is used to render the intermediate drawing. It may be updated to customize drawing 
     * style.
     */
    public drawingStyle: Style = Style.create({
        strokeStyle: "#0069dba0",
        lineWidth: 2,
        lineDash: [15, 5],
        shadowColor: "#0083ff",
        shadowBlur: 5,
    })

    private _viewport: Viewport
    
    /** The viewport capturing repositioning and zooming */
    get viewport(): Viewport {
        return this._viewport
    }

    /** Allows the viewport to be set externally. Setting the viewport triggers a repaint. */
    set viewport(viewport: Viewport) {
        this._viewport = viewport
        this.repaint()
    }

    private _scene: Scene

    /** Returns the current `Scene`. */
    get scene(): Scene {
        return this._scene
    }

    /** Updates the scene to a new value causing a repaint. */
    set scene(s: Scene) {
        this._scene = s
        this.repaint()
    }

    /** Used internally to manage subscribed event listeners */
    private readonly eventEmitter = new EventEmitter()

    /** Captures the Path2D used to reflect the user's drawing while the drawing has not been submitted. */
    private drawingPath: Path2D | null = null

    private constructor(
        public readonly canvas: HTMLCanvasElement,
        scene: Scene,
        public resize: boolean,
        public zoom: boolean,
        public select: boolean,
        public move: boolean,
        public drawingMode: DrawingMode,
        viewport?: Viewport
    ) {
        this._viewport = viewport ?? Viewport.initial()
        this._scene = scene

        this.canvas.width = canvas.scrollWidth
        this.canvas.height = canvas.scrollHeight

        this.repaint()
    }

    /** `on` subscribes for a drawing finished event */
    on(eventName: "drawingFinished", listener: EventListener<DrawingFinishedEvent>): Scenic
    /** `on` subscribes for a selection changed event */
    on(eventName: "selectionChanged", listener: EventListener<ScenicEvent>): Scenic
    /** `on` subscribes for a viewport changed event */
    on(eventName: "viewportChanged", listener: EventListener<ScenicEvent>): Scenic
    /** `on` subscribes for a scene updated event */
    on(eventName: "sceneUpdated", listener: EventListener<ScenicEvent>): Scenic

    on<T extends ScenicEvent>(eventName: EventName, listener: EventListener<T>): Scenic {
        this.eventEmitter.on(eventName, listener)
        return this
    }

    /**
     * `repaint` requests a complete repaint of the canvas. The repaint is synchronized with browser animation
     * handling using `requestAnimationFrame`.
     */
    repaint(): void {
        requestAnimationFrame(() => {
            const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

            ctx.fillStyle = "rgb(200, 200, 200)"
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

            try {
                ctx.save()
                this.viewport.applyTranspose(ctx)
                this.scene.draw(ctx, this.selectionStyle)
            } finally {
                ctx.restore()
            }

            if (this.drawingPath !== null) {
                try {
                    ctx.save()

                    this.drawingStyle.prepare(ctx)
                    if (this.drawingStyle.fillStyle) {
                        ctx.fill(this.drawingPath)
                    }
                    if (this.drawingStyle.strokeStyle) {
                        ctx.stroke(this.drawingPath)
                    }
                } finally {
                    ctx.restore()
                }
            }
        })
    }

    /** emits the given event */
    private emit(evt: ScenicEvent): void {
        this.eventEmitter.emit(evt.eventName, evt)
    }

    /**
     * `connect` adds all listeners from this `Scenic` to the managed canvas.
     */
    private connect(): void {
        window.addEventListener("resize", this.onResize)

        this.canvas.addEventListener("wheel", this.onZoom)

        this.canvas.addEventListener("mousedown", this.onMouseDown)
        this.canvas.addEventListener("touchstart", this.onTouchStart)

        this.canvas.getRootNode()?.addEventListener("mouseup", this.onMouseUp)
        this.canvas.getRootNode()?.addEventListener("touchend", this.onTouchEnd)

        this.canvas.addEventListener("mousemove", this.onMouseMove)
        this.canvas.addEventListener("touchmove", this.onTouchMove)
    }

    /**
     * `disconnect` removes all event listeners from this `Scenic` from the managed canvas.
     */
    private disconnect(): void {
        window.removeEventListener("resize", this.onResize)

        this.canvas.removeEventListener("wheel", this.onZoom)

        this.canvas.removeEventListener("mousedown", this.onMouseDown)
        this.canvas.removeEventListener("touchstart", this.onTouchStart)

        this.canvas.getRootNode()?.removeEventListener("mouseup", this.onMouseUp)
        this.canvas.getRootNode()?.removeEventListener("touchend", this.onTouchEnd)

        this.canvas.removeEventListener("mousemove", this.onMouseMove)
        this.canvas.removeEventListener("touchmove", this.onTouchMove)
    }

    /**
     * `onResize` handles browser window resize events and adjusts the canvas accordingly. It triggers a
     * repaint.
     */
    private onResize = () => {
        if (!this.resize) {
            return
        }

        this.canvas.width = this.canvas.scrollWidth
        this.canvas.height = this.canvas.scrollHeight

        this.repaint()
    }

    private interactOrigin: Point | null = null
    private interactLastCheckpoint: Point | null = null

    private onMouseDown = (evt: MouseEvent) => {
        this.onInteractStart(Point.fromMouseEvent(evt))
    }

    private onTouchStart = (evt: TouchEvent) => {
        this.onInteractStart(Point.fromTouchEvent(evt))
    }

    private onInteractStart(p: Point) {
        this.interactOrigin = p
        this.interactLastCheckpoint = this.interactOrigin
    }

    private onMouseUp = (e: MouseEvent) => {
        this.onInteractEnd(Point.fromMouseEvent(e))
    }

    private onTouchEnd = () => {
        // Touchend contains an empty list of touch events, so we reuse the last submitted point here.
        this.onInteractEnd(this.interactLastCheckpoint!)
    }

    private onInteractEnd = (p: Point) => {
        if (this.interactOrigin === null) {
            return
        }

        try {
            if (this.drawingMode !== null) {
                this.finishDraw(p)
            }

            if (this.select) {
                if (this.interactOrigin?.isSame(p)) {
                    this.handleSelection(p)
                } else if (this.scene.selected.length > 0) {
                    this.emit({
                        eventName: "sceneUpdated",
                        source: this,
                    })
                }
            }
        } finally {
            this.interactLastCheckpoint = null
            this.interactOrigin = null
        }
    }

    private onMouseMove = (evt: MouseEvent) => {
        if (!this.interactLastCheckpoint) {
            return
        }

        evt.preventDefault()
        evt.stopPropagation()
        evt.stopImmediatePropagation()

        this.onInteractMove(Point.fromMouseEvent(evt))
    }

    private onTouchMove = (evt: TouchEvent) => {
        console.log("touchmove", evt.touches.length)        
        if (!this.interactLastCheckpoint) {
            return
        }

        evt.preventDefault()
        evt.stopPropagation()
        evt.stopImmediatePropagation()

        this.onInteractMove(Point.fromTouchEvent(evt))
    }
    
    private onInteractMove = (p: Point) => {
        const drag = this.interactLastCheckpoint!.diff(p)
        this.interactLastCheckpoint = p

        if (this.drawingMode !== null) {
            this.handleDraw(p)
            return
        }

        if (!this.move) {
            return
        }

        const selectedElements = this.scene.selected
        if (selectedElements.length > 0) {
            selectedElements.forEach(e => e.at = e.at.move(drag.diff(this.viewport.scale)))            
            this.repaint()
            return
        }

        this.viewport = this.viewport.move(drag)
        this.repaint()
        this.emit({
            eventName: "viewportChanged",
            source: this,
        })
    }

    private onZoom = (evt: WheelEvent) => {
        if (!this.zoom || this.drawingMode !== null) {
            return
        }

        evt.preventDefault()
        evt.stopPropagation()
        evt.stopImmediatePropagation()

        if (evt.deltaY > 0) {
            this.viewport = this.viewport.zoomOut();
        } else {
            this.viewport = this.viewport.zoomIn();
        }

        this.emit({
            eventName: "viewportChanged",
            source: this,
        })

        this.repaint()
    }

    private handleDraw(p: Point) {        
        this.updateDrawingPath(p)
        this.repaint()
    }

    private finishDraw(p: Point) {        
        this.emit({
            eventName: "drawingFinished",
            source: this,
            path: this.drawingPath,
            start: this.viewport.toCoordinateSpace(this.interactOrigin!),
            end: this.viewport.toCoordinateSpace(p),
            mode: "rect",
        } as DrawingFinishedEvent)

        this.repaint()
        this.drawingPath = null
    }

    private updateDrawingPath(currentPoint: Point) {
        if (this.drawingMode === "rect") {
            const size = this.interactOrigin!.diff(currentPoint)

            this.drawingPath = new Path2D()
            this.drawingPath.rect(this.interactOrigin!.x, this.interactOrigin!.y, size.x, size.y)
        } else if (this.drawingMode === "line") {
            if (this.drawingPath === null) {
                this.drawingPath = new Path2D()
                this.drawingPath.moveTo(this.interactOrigin!.x, this.interactOrigin!.y)
            }
            this.drawingPath.lineTo(currentPoint.x, currentPoint.y)
        }
    }

    private handleSelection(p: Point, ctrlKey?: boolean) {
        p = this.viewport.toCoordinateSpace(p)

        const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D

        const hit = this.scene.firstHit(ctx, p)
        if (hit === null) {
            this.scene.unselectAll()
        } else {
            if (!ctrlKey) {
                this.scene.unselectAll()
            }

            hit.selected = !hit.selected
        }

        this.repaint()

        this.emit({
            eventName: "selectionChanged",
            source: this,
        })
    }
}
