import {TAU} from "../../lib/math.js"
import {Circle} from "./math.js"

export class PulsateRenderer {
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')

    constructor(readonly canvas: HTMLCanvasElement) {

    }

    render(circles: Circle[]): void {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight
        const pixelRatio = devicePixelRatio
        this.canvas.width = width * pixelRatio
        this.canvas.height = height * pixelRatio
        this.context.save()
        this.context.scale(pixelRatio, pixelRatio)
        this.context.clearRect(0, 0, width, height)

        this.context.beginPath()
        circles.forEach(circle => {
            if (0.0 > circle.radius) {
                return
            }
            this.context.moveTo(circle.x + circle.radius, circle.y)
            this.context.arc(circle.x, circle.y, circle.radius, 0.0, TAU)
        })
        this.context.lineWidth = pixelRatio
        this.context.strokeStyle = "orange"
        this.context.stroke()
        this.context.restore()
    }
}