import paper from "paper"
import { Board } from "../board"
import { Game } from "../game"
import { createUnfoldPlan } from "../interact"

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
    let gridLinesLayer = new paper.Layer()
    gridLinesLayer.name = "gridLines"
    let gameLayer = new paper.Layer()
    gameLayer.name = "board"

    // Create our objects
    const board = new Board(boardWidth, boardHeight)
    let game = new Game(board, gameLayer, false)
    paper.view.onFrame = game.onFrame.bind(game)

    // Zoom in and center the view
    paper.view.zoom = zoom
    let bottomRightCorner = new paper.Point(board.width, board.height)
    paper.view.center = bottomRightCorner.multiply(0.5)

    // Draw the grid lines
    game.drawGrid(gridLinesLayer)

    return { container, game }
}

export const MinimalBoard = () => {
    let { container, game } = rigamarole(2, 2, 50)
    let unfoldPlan = createUnfoldPlan(new paper.Point(1, 1), new paper.Point(2, 2))
    game.unfold(unfoldPlan)
    return container
}
