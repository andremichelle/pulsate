import {ObservableImpl, ObservableValue, ObservableValueImpl, Terminable, Terminator} from "../lib/common.js"
import {Injective, PowInjective} from "../lib/injective.js"

export class Sequencer implements Terminable {
    static readonly INTERVAL: number = 1.0
    static readonly LOOK_AHEAD_TIME: number = 0.010
    static readonly SCHEDULE_TIME: number = 0.010
    static readonly ADDITIONAL_LATENCY: number = 0.010

    private readonly terminator: Terminator = new Terminator()

    readonly moving: ObservableImpl<void> = new ObservableImpl<void>()

    private absoluteTime: number = 0.0
    private nextScheduleTime: number = 0.0
    private intervalId: number = -1
    private bpmValue: number

    blockPosition: number = 0.0
    blockComplete: number = 0.0

    constructor(readonly context: AudioContext, readonly bpm: ObservableValue<number> = new ObservableValueImpl<number>(120)) {
        this.bpmValue = bpm.get()
        this.terminator.with(bpm.addObserver((value: number) => {
            const bars = this.secondsToBars(this.absoluteTime)
            this.bpmValue = bpm.get()
            this.absoluteTime = this.barsToSeconds(bars)
        }, false))
    }

    start(): void {
        if (-1 < this.intervalId) {
            return
        }
        if (this.context.state !== 'running') {
            this.context.resume().then(() => null)
        }
        this.nextScheduleTime = this.currentSeconds() + Sequencer.LOOK_AHEAD_TIME
        this.intervalId = setInterval(() => {
            const now = this.currentSeconds()
            if (now + Sequencer.LOOK_AHEAD_TIME >= this.nextScheduleTime) {
                const s0 = this.absoluteTime
                const s1 = s0 + Sequencer.SCHEDULE_TIME
                this.blockPosition = this.secondsToBars(s0)
                this.blockComplete = this.secondsToBars(s1)
                this.moving.notify()
                this.absoluteTime += Sequencer.SCHEDULE_TIME
                this.nextScheduleTime += Sequencer.SCHEDULE_TIME
            }
        }, Sequencer.INTERVAL)
    }

    toSeconds(barPosition: number): number {
        return (this.nextScheduleTime - this.absoluteTime) + this.barsToSeconds(barPosition) + Sequencer.ADDITIONAL_LATENCY
    }

    playMode(value: boolean): void {
        if (value) {
            this.start()
        } else {
            this.stop()
        }
    }

    pause(): void {
        if (-1 === this.intervalId) return
        clearInterval(this.intervalId)
        this.intervalId = -1
    }

    stop(): void {
        this.pause()
        this.absoluteTime = 0.0
    }

    currentSeconds(): number {
        return this.context.currentTime
    }

    barsToSeconds(bars: number): number {
        return bars * 240.0 / this.bpmValue
    }

    secondsToBars(seconds: number): number {
        return seconds * this.bpmValue / 240.0
    }

    bars(): number {
        return this.absoluteTime * this.bpmValue / 240.0
    }

    terminate(): void {
        this.stop()
        this.terminator.terminate()
    }
}

export interface Groove {
    inverse(position: number): number

    transform(position: number): number
}

export class GrooveFunction implements Groove {
    readonly duration: ObservableValue<number> = new ObservableValueImpl<number>(1.0 / 8.0)

    constructor(readonly injective: Injective<any> = new PowInjective()) {
    }

    inverse(position: number): number {
        const duration = this.duration.get()
        const start = Math.floor(position / duration) * duration
        const normalized = (position - start) / duration
        const transformed = this.injective.fx(normalized)
        return start + transformed * duration
    }

    transform(position: number): number {
        const duration = this.duration.get()
        const start = Math.floor(position / duration) * duration
        const normalized = (position - start) / duration
        const transformed = this.injective.fy(normalized)
        return start + transformed * duration
    }
}

const GrooveIdentity = new class implements Groove {
    inverse(position: number): number {
        return position
    }

    transform(position: number): number {
        return position
    }
}

export class Fragmentation {
    readonly scale: ObservableValue<number> = new ObservableValueImpl<number>(1.0 / 16.0)

    readonly pulse: ObservableImpl<void> = new ObservableImpl<void>()

    index: number = 0
    pulsePosition: number = 0.0
    pulseComplete: number = 0.0

    constructor(readonly groove: Groove = GrooveIdentity) {
    }

    divide(sequencer: Sequencer): void {
        const t0: number = this.groove.inverse(sequencer.blockPosition)
        const t1: number = this.groove.inverse(sequencer.blockComplete)
        const scale: number = this.scale.get()
        this.index = (t0 / scale) | 0
        if (this.index < 0) {
            return
        }
        let barPosition = this.index * scale
        while (barPosition < t1) {
            if (barPosition >= t0) {
                this.pulsePosition = this.groove.transform(barPosition)
                this.pulseComplete = this.groove.transform(barPosition + scale)
                this.pulse.notify()
            }
            barPosition = ++this.index * scale
        }
    }
}