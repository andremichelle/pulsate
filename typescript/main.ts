import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {Circle, PulsateSolver} from "./audio/pulsate/math.js"
import {PulsateRenderer} from "./audio/pulsate/renderer.js"
import {PulsateSound} from "./audio/pulsate/sound.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {Waiting} from "./lib/common.js"
import {HTML} from "./lib/dom.js"

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader")
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()))
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"))
    const context = newAudioContext()
    boot.registerProcess(LimiterWorklet.loadModule(context))
    boot.registerProcess(MeterWorklet.loadModule(context))
    const impulse = boot.registerProcess(fetch('./impulse-reverb.wav').then(x => x.arrayBuffer()).then(x => context.decodeAudioData(x)))
    await boot.waitForCompletion()

    const main = HTML.query('main')
    const canvas: HTMLCanvasElement = HTML.query('canvas')
    const renderer = new PulsateRenderer(canvas)
    const solver = new PulsateSolver()
    const sound = new PulsateSound(context, solver, impulse.get())
    const meter = sound.domElement
    meter.style.left = '50%'
    meter.style.transform = 'translate(-50%, 24px)'
    main.appendChild(meter)

    let introVisible = true
    window.addEventListener("mousedown", event => {
        const rect = canvas.getBoundingClientRect()
        const mx = event.clientX - rect.x
        const my = event.clientY - rect.y
        solver.circles.push(new Circle(mx, my, 0.0, 50.0 * devicePixelRatio))
        if (introVisible) {
            introVisible = false
            ;(async () => {
                const intro = HTML.query('p.intro')
                intro.classList.add('disappear')
                await Waiting.forTransitionComplete(intro)
            })()
        }
    })
    window.addEventListener("keydown", event => {
        if (event.code === "Space") {
            solver.clear()
        }
    })
    sound.start()

    // --- BOOT ENDS ---
    const frame = () => {
        renderer.render(solver.circles)
        requestAnimationFrame(frame)
    }
    frame()

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), {passive: false})
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()