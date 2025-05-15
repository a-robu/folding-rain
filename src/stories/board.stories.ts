import paper from "paper"
import { Board } from "../board"
import { Game } from "../game"
import { createUnfoldPlan } from "../interact"

export default {
    title: "PaperJS/Minimal Board"
}

export const MinimalBoard = () => {
    // Create a container for the canvas
    const container = document.createElement("div")
    container.style.width = "400px"
    container.style.height = "400px"

    // Create the canvas
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400
    canvas.style.outline = "2px solid #ddd"
    canvas.style.borderRadius = "2px"
    canvas.id = "storybook-canvas"
    container.appendChild(canvas)

    // Setup Paper.js
    paper.setup(canvas)

    // Create the board (adjust args as needed)
    const board = new Board(7, 7)

    let gameLayer = new paper.Layer()
    gameLayer.name = "board"
    // let uiLayer = new paper.Layer()
    // uiLayer.name = "ui"

    // let board = new Board(20, 20)
    let game = new Game(board, gameLayer)
    let unfoldPlan = createUnfoldPlan(new paper.Point(1, 1), new paper.Point(2, 2))
    game.unfold(unfoldPlan)
    game.drawGrid(board)

    paper.view.zoom = 50

    let bottomRightCorner = new paper.Point(board.width, board.height)
    paper.view.center = bottomRightCorner.multiply(0.5)

    paper.view.onFrame = game.onFrame.bind(game)
    // board.

    // Optionally, draw the grid or something visual
    // board.drawGrid?.();

    return container
}
