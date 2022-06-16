import { ObservableImpl, ObservableValue, Terminable } from "../lib/common.js";
import { Injective } from "../lib/injective.js";
export declare class Sequencer implements Terminable {
    readonly context: AudioContext;
    readonly bpm: ObservableValue<number>;
    static readonly INTERVAL: number;
    static readonly LOOK_AHEAD_TIME: number;
    static readonly SCHEDULE_TIME: number;
    static readonly ADDITIONAL_LATENCY: number;
    private readonly terminator;
    readonly moving: ObservableImpl<void>;
    private absoluteTime;
    private nextScheduleTime;
    private intervalId;
    private bpmValue;
    blockPosition: number;
    blockComplete: number;
    constructor(context: AudioContext, bpm?: ObservableValue<number>);
    start(): void;
    toSeconds(barPosition: number): number;
    playMode(value: boolean): void;
    pause(): void;
    stop(): void;
    currentSeconds(): number;
    barsToSeconds(bars: number): number;
    secondsToBars(seconds: number): number;
    bars(): number;
    terminate(): void;
}
export interface Groove {
    inverse(position: number): number;
    transform(position: number): number;
}
export declare class GrooveFunction implements Groove {
    readonly injective: Injective<any>;
    readonly duration: ObservableValue<number>;
    constructor(injective?: Injective<any>);
    inverse(position: number): number;
    transform(position: number): number;
}
export declare class Fragmentation {
    readonly groove: Groove;
    readonly scale: ObservableValue<number>;
    readonly pulse: ObservableImpl<void>;
    index: number;
    pulsePosition: number;
    pulseComplete: number;
    constructor(groove?: Groove);
    divide(sequencer: Sequencer): void;
}
