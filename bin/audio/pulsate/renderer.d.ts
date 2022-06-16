import { Circle } from "./math.js";
export declare class PulsateRenderer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement);
    render(circles: Circle[]): void;
}
