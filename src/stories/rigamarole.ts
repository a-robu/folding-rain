import { init } from "@/init"
import paper from "paper"
import { ContactViz } from "./contact-viz"
import { LabelViz } from "./label-viz"

declare global {
    interface Window {
        animatedBoard: any
        lattice: any
    }
}

export function rigamarole({
    bounds = new paper.Rectangle(0, 0, 5, 5),
    zoom = 50,
    pixelWidth = 400,
    pixelheight = 400,
    drawGridLines = true,
    latticeAvailability = false,
    latticeContactid = false,
    speedFactor = 1,
    showShapeId = false
}: {
    bounds?: paper.Rectangle
    zoom?: number
    pixelWidth?: number
    pixelheight?: number
    drawGridLines?: boolean
    latticeAvailability?: boolean
    latticeContactid?: boolean
    speedFactor?: number
    showShapeId?: boolean
} = {}) {
    // Create the canvas and bind paper.js to it
    const container = document.createElement("div")
    container.style.width = `${pixelWidth}px`
    container.style.height = `${pixelheight}px`
    const canvas = document.createElement("canvas")
    canvas.width = pixelWidth
    canvas.height = pixelheight
    canvas.style.outline = "2px solid #ddd"
    canvas.style.borderRadius = "2px"
    container.appendChild(canvas)
    paper.setup(canvas)

    let { animatedBoard, annotationsLayer } = init(bounds, zoom, drawGridLines, speedFactor)

    window.animatedBoard = animatedBoard

    let contactVizInstance: ContactViz | undefined = undefined
    if (latticeAvailability || latticeContactid) {
        contactVizInstance = new ContactViz(
            bounds,
            annotationsLayer,
            animatedBoard,
            latticeAvailability,
            latticeContactid
        )
    }

    let labelVizInstance: LabelViz | undefined = undefined
    if (showShapeId) {
        labelVizInstance = new LabelViz(annotationsLayer, animatedBoard)
    }

    return {
        container,
        animatedBoard,
        annotationsLayer,
        contactViz: contactVizInstance,
        labelViz: labelVizInstance
    }
}
