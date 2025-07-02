import paper from "paper"
import { GUI } from "@/gui"
import { computeBounds, Board, ProceduralAnimation } from "@/index"

function onResize() {
    proceduralAnimation.bounds = computeBounds()
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
paper.setup(canvas)
paper.view.zoom = 50

let seed: number
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has("seed")) {
    seed = parseInt(urlParams.get("seed")!)
    console.log("Using provided seed:", seed)
} else {
    seed = Math.floor(Math.random() * 10000)
    console.log("Generating random seed:", seed, "Link:", window.location.href + "?seed=" + seed)
}
let boardLayer = new paper.Layer()
let board = new Board()
boardLayer.addChild(board.paperGroup)
paper.view.onFrame = board.onFrame.bind(board)
let initialBounds = computeBounds()
paper.view.center = initialBounds.center
let proceduralAnimation = new ProceduralAnimation(board, initialBounds, seed)
paper.view.onResize = onResize
onResize()
let gui = new GUI(paper.view)
gui.attachPinchZoom(canvas)
gui.onResize = onResize
let tool = new paper.Tool()
tool.onMouseDrag = (e: paper.ToolEvent) => {
    onResize()
    gui.onMouseDrag(e)
}
canvas.addEventListener("wheel", (e: WheelEvent) => {
    onResize()
    gui.onWheel(e)
})

proceduralAnimation.rainContinuously()
