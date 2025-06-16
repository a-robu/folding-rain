import { init } from "@/init"
import paper from "paper"
import { ContactViz } from "./contact-viz"
import { LabelViz } from "./label-viz"

declare global {
    interface Window {
        board: any
        lattice: any
    }
}

export function rigamarole({
    bounds = new paper.Rectangle(0, 0, 5, 5),
    zoom = 50,
    pixelWidth,
    pixelHeight,
    drawGridLines = true,
    latticeAvailability = false,
    latticeContactid = false,
    speedFactor = 1,
    showShapeId = false,
    showVertexLabels = "off"
}: {
    bounds?: paper.Rectangle
    zoom?: number
    pixelWidth?: number
    pixelHeight?: number
    drawGridLines?: boolean
    latticeAvailability?: boolean
    latticeContactid?: boolean
    speedFactor?: number
    showShapeId?: boolean
    showVertexLabels?: "off" | "vertexId" | "vertexAngle"
} = {}) {
    // Automatically determine pixelWidth and pixelHeight if not provided
    const computedPixelWidth = pixelWidth ?? Math.round(bounds.width * zoom)
    const computedPixelHeight = pixelHeight ?? Math.round(bounds.height * zoom)
    // Create the canvas and bind paper.js to it
    const container = document.createElement("div")
    container.style.width = `${computedPixelWidth}px`
    container.style.height = `${computedPixelHeight}px`
    const canvas = document.createElement("canvas")
    canvas.width = computedPixelWidth
    canvas.height = computedPixelHeight
    canvas.style.outline = "2px solid #ddd"
    canvas.style.borderRadius = "2px"
    container.appendChild(canvas)
    paper.setup(canvas)

    let { board, annotationsLayer } = init(bounds, zoom, drawGridLines, speedFactor)

    window.board = board

    let contactVizInstance: ContactViz | undefined = undefined
    if (latticeAvailability || latticeContactid) {
        contactVizInstance = new ContactViz(
            bounds,
            annotationsLayer,
            board,
            latticeAvailability,
            latticeContactid
        )
    }

    let labelVizInstance: LabelViz | undefined = undefined
    if (showShapeId) {
        labelVizInstance = new LabelViz(annotationsLayer, board)
    }

    // Vertex label visualization
    let vertexLabelsGroup: paper.Group | undefined
    function updateVertexLabelsForAllShapes() {
        if (!vertexLabelsGroup) return
        vertexLabelsGroup.removeChildren()
        for (const shape of board.shapes.values()) {
            shape.segments.forEach((segment, index) => {
                let circle = new paper.Path.Circle({
                    center: segment.point,
                    radius: 0.15,
                    fillColor: "white",
                    strokeColor: "black",
                    strokeWidth: 0.02
                })
                if (vertexLabelsGroup) vertexLabelsGroup.addChild(circle)
                let labelContent: string | number = ""
                if (showVertexLabels === "vertexId") {
                    labelContent = index
                } else if (showVertexLabels === "vertexAngle") {
                    const prev = shape.segments[index].previous.point.subtract(segment.point)
                    const next = shape.segments[index].next.point.subtract(segment.point)
                    const angle = Math.round(
                        (Math.acos(prev.normalize().dot(next.normalize())) * 180) / Math.PI
                    )
                    labelContent = angle
                }
                let label = new paper.PointText({
                    content: labelContent,
                    point: segment.point.add(new paper.Point(0, 0.05)),
                    fillColor: "black",
                    fontSize: 0.2,
                    justification: "center"
                })
                if (vertexLabelsGroup) vertexLabelsGroup.addChild(label)
            })
        }
    }

    function setShowVertexLabels(newValue: "off" | "vertexId" | "vertexAngle") {
        showVertexLabels = newValue
        if (vertexLabelsGroup) {
            vertexLabelsGroup.remove()
            vertexLabelsGroup = undefined
        }
        if (showVertexLabels !== "off") {
            vertexLabelsGroup = new paper.Group()
            updateVertexLabelsForAllShapes()
            board.addShapeUpdateListener(updateVertexLabelsForAllShapes)
        }
    }

    // Initialize if not off
    if (showVertexLabels !== "off") {
        vertexLabelsGroup = new paper.Group()
        updateVertexLabelsForAllShapes()
        board.addShapeUpdateListener(updateVertexLabelsForAllShapes)
    }

    return {
        container,
        board,
        annotationsLayer,
        contactViz: contactVizInstance,
        labelViz: labelVizInstance,
        vertexLabelsGroup,
        setShowVertexLabels
    }
}
