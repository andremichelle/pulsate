import { TAU } from "../../lib/math.js";
export class PulsateRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
    }
    render(circles) {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const pixelRatio = devicePixelRatio;
        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;
        this.context.save();
        this.context.scale(pixelRatio, pixelRatio);
        this.context.clearRect(0, 0, width, height);
        this.context.beginPath();
        circles.forEach(circle => {
            if (0.0 > circle.radius) {
                return;
            }
            this.context.moveTo(circle.x + circle.radius, circle.y);
            this.context.arc(circle.x, circle.y, circle.radius, 0.0, TAU);
        });
        this.context.lineWidth = pixelRatio;
        this.context.strokeStyle = "orange";
        this.context.stroke();
        this.context.restore();
    }
}
//# sourceMappingURL=renderer.js.map