import paper from "paper"
// import { Board } from "../board"
// import { Game } from "../game"
// import { VisualBoard } from "@/visual-board"
import { VisualBoard } from "../visual-board"
import { FOLD_COLORING, FoldCoordinates } from "../lib/fold"
// import { createFold } from "../lib/fold"

export default {
    title: "PaperJS"
}

function rigamarole(boardWidth = 7, boardHeight = 7, zoom = 50) {
    // Create the canvas and bind paper.js to it
    const container = document.createElement("div")
    container.style.width = "400px"
    container.style.height = "400px"
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400
    canvas.style.outline = "2px solid #ddd"
    canvas.style.borderRadius = "2px"
    container.appendChild(canvas)
    paper.setup(canvas)

    // Create the layers
    let shapesLayer = new paper.Layer()
    shapesLayer.name = "Shapes"
    let animationLayer = new paper.Layer()
    animationLayer.name = "Animation"

    // To catch intermediate path objects that are created
    // for calculations only.
    let trapLayer = new paper.Layer()
    trapLayer.activate()
    trapLayer.visible = false

    let visualBoard = new VisualBoard(shapesLayer, animationLayer)

    paper.view.onFrame = visualBoard.onFrame.bind(visualBoard)
    // paper.view

    // Zoom in and center the view
    paper.view.zoom = zoom
    let bottomRightCorner = new paper.Point(boardWidth, boardHeight)
    paper.view.center = bottomRightCorner.multiply(0.5)

    // Draw the grid lines
    // game.drawGrid(gridLinesLayer)

    return { container, visualBoard }
}

export function triangleIn1x1Board() {
    let { container, visualBoard } = rigamarole()
    visualBoard.fold(
        1,
        FoldCoordinates.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
        FOLD_COLORING.Create
    )

    visualBoard.fold(
        2,
        FoldCoordinates.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
        FOLD_COLORING.Create
    )

    visualBoard.fold(
        3,
        FoldCoordinates.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
        FOLD_COLORING.Create
    )
    // let { container, game } = rigamarole(1, 1, 50)
    // let unfoldPlan = createFold(new paper.Point(0, 0), new paper.Point(1, 1))
    // game.unfold(unfoldPlan)
    return container
}
triangleIn1x1Board.storyName = "One Triangle in a 1x1 Board"
