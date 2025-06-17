import paper from "paper"
import { Board } from "@/board"
import { drawGrid } from "@/draw-grid"
import { XORShift } from "random-seedable"

export function init(bounds: paper.Rectangle, zoom: number, gridLines: boolean, speedFactor = 1) {
    let gridLinesLayer = new paper.Layer()
    gridLinesLayer.name = "Grid Lines"
    let shapesLayer = new paper.Layer()
    shapesLayer.name = "Shapes"
    let animationLayer = new paper.Layer()
    animationLayer.name = "Animation"
    let trapLayer = new paper.Layer() // Traps paths made for calculations
    trapLayer.activate()
    trapLayer.visible = true
    let annotationsLayer = new paper.Layer()
    annotationsLayer.name = "Annotations"

    let board = new Board(shapesLayer, animationLayer, new XORShift(123456789))
    board.speedFactor = speedFactor
    paper.view.onFrame = board.onFrame.bind(board)

    // Zoom in and center the view
    paper.view.zoom = zoom
    paper.view.center = bounds.center

    if (gridLines) {
        drawGrid(gridLinesLayer, bounds)
    }

    return {
        board,
        annotationsLayer
    }
}
