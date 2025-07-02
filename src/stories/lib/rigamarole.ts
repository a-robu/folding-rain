import { init } from "@/init"
import paper from "paper"
// import { ContactViz } from "./contact-viz"
import { LabelViz } from "./label-viz"
import type { Board } from "@/board"
import { drawGrid } from "@/draw-grid"

declare global {
    interface Window {
        board: any
        grid: any
    }
}

function computePixelDimensions(
    bounds: paper.Rectangle,
    zoom: number,
    pixelWidth?: number,
    pixelHeight?: number
): { pixelWidth: number; pixelHeight: number } {
    return {
        pixelWidth: pixelWidth ?? Math.round(bounds.width * zoom),
        pixelHeight: pixelHeight ?? Math.round(bounds.height * zoom)
    }
}

function applyCanvasDimensions(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    pixelWidth: number,
    pixelHeight: number
) {
    container.style.width = `${pixelWidth}px`
    container.style.height = `${pixelHeight}px`
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    canvas.style.outline = "2px solid #ddd"
    canvas.style.borderRadius = "2px"
}

export function rigamarole({
    bounds = new paper.Rectangle(0, 0, 5, 5),
    zoom = 50,
    pixelWidth,
    pixelHeight,
    drawGridLines = true,
    board,
    speedFactor = 1,
    showShapeId = false,
    showVertexLabels = "off"
}: {
    bounds?: paper.Rectangle
    zoom?: number
    pixelWidth?: number
    pixelHeight?: number
    drawGridLines?: boolean
    board?: Board
    speedFactor?: number
    showShapeId?: boolean
    showVertexLabels?: "off" | "vertexId" | "vertexAngle"
} = {}) {
    let computedDimensions = computePixelDimensions(bounds, zoom, pixelWidth, pixelHeight)
    const container = document.createElement("div")
    const canvas = document.createElement("canvas")
    applyCanvasDimensions(
        container,
        canvas,
        computedDimensions.pixelWidth,
        computedDimensions.pixelHeight
    )
    container.appendChild(canvas)
    paper.setup(canvas)

    let {
        board: gottenBoard,
        annotationsLayer,
        gridLinesLayer
    } = init(bounds, zoom, drawGridLines, speedFactor, board)
    board = gottenBoard

    window.board = board

    // let contactVizInstance: ContactViz | undefined = undefined

    let labelVizInstance: LabelViz | undefined = undefined
    if (showShapeId) {
        labelVizInstance = new LabelViz(annotationsLayer, board)
    }

    // Vertex label visualization
    let vertexLabelsGroup: paper.Group | undefined
    function updateVertexLabelsForAllShapes() {
        if (!vertexLabelsGroup) return
        vertexLabelsGroup.removeChildren()
        for (const shape of board!.shapes.values()) {
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
            board!.addShapeUpdateListener(updateVertexLabelsForAllShapes)
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
        // contactViz: contactVizInstance,
        labelViz: labelVizInstance,
        vertexLabelsGroup,
        setShowVertexLabels,
        resize: (newBounds: paper.Rectangle) => {
            let newDimensions = computePixelDimensions(newBounds, zoom)
            paper.view.zoom = zoom
            paper.view.viewSize = new paper.Size(
                newDimensions.pixelWidth,
                newDimensions.pixelHeight
            )
            paper.view.center = newBounds.center
            gridLinesLayer.removeChildren()
            if (drawGridLines) {
                drawGrid(gridLinesLayer, newBounds)
            }
        }
    }
}
