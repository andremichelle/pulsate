import { PulsateSolver } from "./math.js";
export declare class PulsateSound {
    private readonly sequencer;
    private readonly meterWorklet;
    constructor(context: AudioContext, solver: PulsateSolver, buffer: AudioBuffer);
    get domElement(): HTMLElement;
    start(): void;
}
