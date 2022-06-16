import {midiToHz} from "../common.js"
import {LimiterWorklet} from "../limiter/worklet.js"
import {StereoMeterWorklet} from "../meter/worklet.js"
import {Fragmentation, Sequencer} from "../sequencing.js"
import {Collision, CollisionPair, PulsateSolver} from "./math.js"

const radiusToNote = ((): (radius: number) => number => {
    const notes = new Uint32Array([0, 2, 5, 7, 9])
    const minRadius: number = 1.0
    const maxRadius: number = 160.0
    return (radius: number): number => {
        if (radius < minRadius) {
            radius = minRadius
        }
        if (radius > maxRadius) {
            radius = maxRadius
        }
        const norm = (radius - minRadius) / (maxRadius - minRadius)
        const index = Math.floor(36.0 - 36.0 * norm)
        let o = Math.floor(index / 5)
        if (o < 4) {
            o = 4
        }
        return o * 12 + notes[(index % 5)]
    }
})()

const echo = (context: AudioContext, input: AudioNode, output: AudioNode, delayTime: number, feedback: number, wetLevel: number): void => {
    const delay = context.createDelay()
    delay.delayTime.value = delayTime
    const feedbackGain = context.createGain()
    feedbackGain.gain.value = feedback
    const wetGain = context.createGain()
    wetGain.gain.value = wetLevel
    input.connect(delay).connect(feedbackGain).connect(delay)
    feedbackGain.connect(wetGain).connect(output)
}

export class PulsateSound {
    private readonly sequencer: Sequencer
    private readonly meterWorklet: StereoMeterWorklet

    constructor(context: AudioContext, solver: PulsateSolver, buffer: AudioBuffer) {
        this.sequencer = new Sequencer(context)
        this.meterWorklet = new StereoMeterWorklet(context)

        const masterGain = context.createGain()
        masterGain.gain.value = 0.3
        const convolverNode = context.createConvolver()
        convolverNode.buffer = buffer
        const limiterWorklet = new LimiterWorklet(context)
        masterGain.connect(limiterWorklet)
        convolverNode.connect(limiterWorklet)
        echo(context, masterGain, convolverNode, 0.5, 0.7, 0.4)
        limiterWorklet.connect(this.meterWorklet).connect(context.destination)

        const fragmentation = new Fragmentation()
        const stepTime = 1.0 / 256.0
        fragmentation.scale.set(stepTime)
        fragmentation.pulse.addObserver(() => {
            solver.run(stepTime, (collision: Collision) => {
                if (collision instanceof CollisionPair) {
                    const startTime = this.sequencer.toSeconds(fragmentation.pulsePosition + collision.time)
                    const stopTime = startTime + 0.100
                    const envelope = context.createGain()
                    envelope.gain.value = 1.0
                    envelope.gain.linearRampToValueAtTime(0.0, stopTime)
                    const oscA = context.createOscillator()
                    const fA = midiToHz(radiusToNote(collision.circleA.radius), 440.0)
                    const fB = midiToHz(radiusToNote(collision.circleB.radius), 440.0)
                    oscA.frequency.value = fA
                    oscA.start(startTime)
                    oscA.stop(stopTime)
                    oscA.connect(envelope).connect(masterGain)
                    const oscB = context.createOscillator()
                    oscB.frequency.value = fB
                    oscB.start(startTime)
                    oscB.stop(stopTime)
                    oscB.connect(envelope).connect(masterGain)
                }
            })
        })
        this.sequencer.moving.addObserver(() => fragmentation.divide(this.sequencer))
    }

    get domElement(): HTMLElement {
        return this.meterWorklet.domElement;
    }

    start() {
        this.sequencer.start()
    }
}