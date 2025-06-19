import paper from "paper"
import { Board } from "@/board"
import { drawGrid } from "@/draw-grid"

export function init(
    bounds: paper.Rectangle,
    zoom: number,
    gridLines: boolean,
    speedFactor = 1,
    board?: Board
) {
    let gridLinesLayer = new paper.Layer()
    gridLinesLayer.name = "Grid"
    let boardLayer = new paper.Layer()
    boardLayer.name = "Board"
    let trapLayer = new paper.Layer() // Traps paths made for calculations
    trapLayer.activate()
    trapLayer.visible = true
    let annotationsLayer = new paper.Layer()
    annotationsLayer.name = "Annotations"

    board = board || new Board()
    boardLayer.addChild(board.paperGroup)
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
        annotationsLayer,
        gridLinesLayer
    }
}
