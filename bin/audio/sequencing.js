import { ObservableImpl, ObservableValueImpl, Terminator } from "../lib/common.js";
import { PowInjective } from "../lib/injective.js";
export class Sequencer {
    constructor(context, bpm = new ObservableValueImpl(120)) {
        this.context = context;
        this.bpm = bpm;
        this.terminator = new Terminator();
        this.moving = new ObservableImpl();
        this.absoluteTime = 0.0;
        this.nextScheduleTime = 0.0;
        this.intervalId = -1;
        this.blockPosition = 0.0;
        this.blockComplete = 0.0;
        this.bpmValue = bpm.get();
        this.terminator.with(bpm.addObserver((value) => {
            const bars = this.secondsToBars(this.absoluteTime);
            this.bpmValue = bpm.get();
            this.absoluteTime = this.barsToSeconds(bars);
        }, false));
    }
    start() {
        if (-1 < this.intervalId) {
            return;
        }
        if (this.context.state !== 'running') {
            this.context.resume().then(() => null);
        }
        this.nextScheduleTime = this.currentSeconds() + Sequencer.LOOK_AHEAD_TIME;
        this.intervalId = setInterval(() => {
            const now = this.currentSeconds();
            if (now + Sequencer.LOOK_AHEAD_TIME >= this.nextScheduleTime) {
                const s0 = this.absoluteTime;
                const s1 = s0 + Sequencer.SCHEDULE_TIME;
                this.blockPosition = this.secondsToBars(s0);
                this.blockComplete = this.secondsToBars(s1);
                this.moving.notify();
                this.absoluteTime += Sequencer.SCHEDULE_TIME;
                this.nextScheduleTime += Sequencer.SCHEDULE_TIME;
            }
        }, Sequencer.INTERVAL);
    }
    toSeconds(barPosition) {
        return (this.nextScheduleTime - this.absoluteTime) + this.barsToSeconds(barPosition) + Sequencer.ADDITIONAL_LATENCY;
    }
    playMode(value) {
        if (value) {
            this.start();
        }
        else {
            this.stop();
        }
    }
    pause() {
        if (-1 === this.intervalId)
            return;
        clearInterval(this.intervalId);
        this.intervalId = -1;
    }
    stop() {
        this.pause();
        this.absoluteTime = 0.0;
    }
    currentSeconds() {
        return this.context.currentTime;
    }
    barsToSeconds(bars) {
        return bars * 240.0 / this.bpmValue;
    }
    secondsToBars(seconds) {
        return seconds * this.bpmValue / 240.0;
    }
    bars() {
        return this.absoluteTime * this.bpmValue / 240.0;
    }
    terminate() {
        this.stop();
        this.terminator.terminate();
    }
}
Sequencer.INTERVAL = 1.0;
Sequencer.LOOK_AHEAD_TIME = 0.010;
Sequencer.SCHEDULE_TIME = 0.010;
Sequencer.ADDITIONAL_LATENCY = 0.010;
export class GrooveFunction {
    constructor(injective = new PowInjective()) {
        this.injective = injective;
        this.duration = new ObservableValueImpl(1.0 / 8.0);
    }
    inverse(position) {
        const duration = this.duration.get();
        const start = Math.floor(position / duration) * duration;
        const normalized = (position - start) / duration;
        const transformed = this.injective.fx(normalized);
        return start + transformed * duration;
    }
    transform(position) {
        const duration = this.duration.get();
        const start = Math.floor(position / duration) * duration;
        const normalized = (position - start) / duration;
        const transformed = this.injective.fy(normalized);
        return start + transformed * duration;
    }
}
const GrooveIdentity = new class {
    inverse(position) {
        return position;
    }
    transform(position) {
        return position;
    }
};
export class Fragmentation {
    constructor(groove = GrooveIdentity) {
        this.groove = groove;
        this.scale = new ObservableValueImpl(1.0 / 16.0);
        this.pulse = new ObservableImpl();
        this.index = 0;
        this.pulsePosition = 0.0;
        this.pulseComplete = 0.0;
    }
    divide(sequencer) {
        const t0 = this.groove.inverse(sequencer.blockPosition);
        const t1 = this.groove.inverse(sequencer.blockComplete);
        const scale = this.scale.get();
        this.index = (t0 / scale) | 0;
        if (this.index < 0) {
            return;
        }
        let barPosition = this.index * scale;
        while (barPosition < t1) {
            if (barPosition >= t0) {
                this.pulsePosition = this.groove.transform(barPosition);
                this.pulseComplete = this.groove.transform(barPosition + scale);
                this.pulse.notify();
            }
            barPosition = ++this.index * scale;
        }
    }
}
//# sourceMappingURL=sequencing.js.map