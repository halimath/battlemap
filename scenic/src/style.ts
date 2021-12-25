export class Color {
    static fromRGBBytes(r: number, g: number, b: number, a = 1): Color {
        return new Color(r / 255, g / 255, b / 255, a)
    }

    static parseHex(c: string): Color {
        if (c.charAt(0) !== "#") {
            throw new Error(`Invalid color hex string: '${c}'`)
        }

        let parts = c.substring(1).split("")
        if (parts.length === 3) {
            parts = parts.reduce((a, c) => a.concat([c, c]), [] as Array<string>)
        }

        if (parts.length !== 6) {
            throw new Error(`Invalid color hex string: '${c}'`)
        }

        return Color.fromRGBBytes(parseInt(parts[0] + parts[1], 16), parseInt(parts[2] + parts[3], 16), parseInt(parts[4] + parts[5], 16))
    }

    constructor(
        public readonly red: number,
        public readonly green: number,
        public readonly blue: number,
        public readonly alpha: number = 1.0,
    ) {
        if (red < 0 || red > 1) {
            throw new Error(`invalid red component: ${this.red}`)
        }
        if (green < 0 || green > 1) {
            throw new Error(`invalid green component: ${this.green}`)
        }
        if (blue < 0 || blue > 1) {
            throw new Error(`invalid blue component: ${this.blue}`)
        }
        if (alpha < 0 || alpha > 1) {
            throw new Error(`invalid alpha component: ${this.alpha}`)
        }
    }

    lighten(ratio: number): Color {
        return new Color(
            Math.min(this.red + this.red * ratio, 1.0),
            Math.min(this.green + this.green * ratio, 1.0),
            Math.min(this.blue + this.blue * ratio, 1.0),
            this.alpha,
        )
    }

    darken(ratio: number): Color {
        return new Color(
            Math.max(this.red - this.red * ratio, 0),
            Math.max(this.green - this.green * ratio, 0),
            Math.max(this.blue - this.blue * ratio, 0),
            this.alpha,
        )
    }

    withAlpha(alpha: number): Color {
        if (alpha < 0 || alpha > 1) {
            throw new Error(`invalid alpha component: ${this.alpha}`)
        }

        return new Color(this.red, this.green, this.blue, alpha)
    }

    toCSS(): string {
        return `rgba(${this.red * 255}, ${this.green * 255}, ${this.blue * 255}, ${this.alpha})`
    }

    toString(): string {
        return this.toCSS()
    }
}

export type ColorStyle = string | Color
export type FillOrStrokeStyle = ColorStyle | CanvasGradient | CanvasPattern
export type FillStyle = FillOrStrokeStyle
export type StrokeStyle = FillOrStrokeStyle

export interface StyleOptions {
    fillStyle?: FillStyle

    strokeStyle?: StrokeStyle
    lineWidth?: number
    lineCap?: CanvasLineCap
    lineJoin?: CanvasLineJoin
    lineDash?: number | Array<number>

    shadowOffsetX?: number
    shadowOffsetY?: number
    shadowBlur?: number
    shadowColor?: ColorStyle

    fontSize?: number
    fontFamily?: string
    textAlign?: CanvasTextAlign
    direction?: CanvasDirection
}

export class Style {
    static create(opts?: StyleOptions | Style): Style {
        if (opts && (opts instanceof Style)) {
            return opts
        }
        
        return new Style(
            opts?.fillStyle ?? null,
            opts?.strokeStyle ?? null,
            opts?.lineWidth ?? null,
            opts?.lineCap ?? null,
            opts?.lineJoin ?? null,
            opts?.lineDash ?? null,
            opts?.shadowOffsetX ?? null,
            opts?.shadowOffsetY ?? null,
            opts?.shadowBlur ?? null,
            opts?.shadowColor ?? null,
            opts?.fontSize ?? null,
            opts?.fontFamily ?? null,
            opts?.textAlign ?? null,
            opts?.direction ?? null,
        )
    }

    public readonly lineDash: Array<number> | null

    constructor(
        public readonly fillStyle: FillOrStrokeStyle | null,
        public readonly strokeStyle: FillOrStrokeStyle | null,
        public readonly lineWidth: number | null,
        public readonly lineCap: CanvasLineCap | null,
        public readonly lineJoin: CanvasLineJoin | null,
        lineDash: number | Array<number> | null,
        public readonly shadowOffsetX: number | null,
        public readonly shadowOffsetY: number | null,
        public readonly shadowBlur: number | null,
        public readonly shadowColor: ColorStyle | null,
        public readonly fontSize: number | null,
        public readonly fontFamily: string | null,
        public readonly textAlign: CanvasTextAlign | null,
        public readonly direction: CanvasDirection | null,
    ) {
        this.lineDash = (typeof lineDash === "number") ? [lineDash] : lineDash
    }

    prepare(ctx: CanvasRenderingContext2D) {
        if (this.fillStyle !== null) {
            ctx.fillStyle = convertFillOrStrokeStyle(this.fillStyle)
        }

        if (this.strokeStyle !== null) {
            ctx.strokeStyle = convertFillOrStrokeStyle(this.strokeStyle)
        }

        if (this.lineWidth) {
            ctx.lineWidth = this.lineWidth
        }

        if (this.lineDash !== null) {
            ctx.setLineDash(this.lineDash)
        }

        if (this.lineCap) {
            ctx.lineCap = this.lineCap
        }

        if (this.lineJoin) {
            ctx.lineJoin = this.lineJoin
        }

        if (this.shadowOffsetX) {
            ctx.shadowOffsetX = this.shadowOffsetX
        }

        if (this.shadowOffsetY) {
            ctx.shadowOffsetY = this.shadowOffsetY
        }

        if (this.shadowBlur) {
            ctx.shadowBlur = this.shadowBlur
        }

        if (this.shadowColor) {
            ctx.shadowColor = this.shadowColor.toString()
        }

        if (this.fontFamily || this.fontSize) {
            ctx.font = `${this.fontSize ?? 10}px ${this.fontFamily ?? "sans-serif"}`
        }

        if (this.textAlign) {
            ctx.textAlign = this.textAlign
        }

        if (this.direction) {
            ctx.direction = this.direction
        }
    }

    apply(ctx: CanvasRenderingContext2D) {
        if (this.fillStyle) {
            ctx.fill()
        }

        if (this.strokeStyle) {
            ctx.stroke()
        }
    }
}

function convertFillOrStrokeStyle (s: FillOrStrokeStyle): string | CanvasGradient | CanvasPattern {
    if (s instanceof Color) {
        return s.toCSS()    
    }

    return s
}
