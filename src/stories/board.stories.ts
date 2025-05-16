import paper from "paper"
// import { Board } from "../board"
// import { Game } from "../game"
// import { VisualBoard } from "@/visual-board"
import { AnimatedBoard } from "../visual-board"
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

    let visualBoard = new AnimatedBoard(shapesLayer, animationLayer)

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

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function exponentialDelay(ratePerSecond: number): number {
    // λ = rate (events per second)
    // Exponential distribution: -ln(U) / λ
    const U = Math.random()
    return (-Math.log(1 - U) / ratePerSecond) * 1000 // Convert to milliseconds
}

export function threeTriangles() {
    let { container, visualBoard } = rigamarole()

    // let board = ...

    async function doFolds() {
        // board.fold()
        // board.onFold
        // acquireLock
        // lock.release()

        visualBoard.fold(
            1,
            FoldCoordinates.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
            FOLD_COLORING.Create
        )
        await sleep(1000)

        visualBoard.fold(
            2,
            FoldCoordinates.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
            FOLD_COLORING.Create
        )
        await sleep(1000)

        visualBoard.fold(
            3,
            FoldCoordinates.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
            FOLD_COLORING.Create
        )
    }

    doFolds()

    return container
}

export function rain() {
    let { container, visualBoard } = rigamarole(20, 20, 20)

    // let board = ...

    async function doFolds() {
        // board.fold()
        // board.onFold
        // acquireLock
        // lock.release()

        let i = 0

        let choices = []

        for (let x = 0; x < 20; x++) {
            for (let y = 0; y < 20; y++) {
                choices.push([x, y])
            }
        }

        while (choices.length > 0) {
            let index = Math.floor(Math.random() * choices.length)
            let [x, y] = choices[index]
            choices.splice(index, 1)

            let topLeft = new paper.Point(x, y).multiply(2)
            visualBoard.fold(
                i,
                FoldCoordinates.fromEndPoints(topLeft, topLeft.add(new paper.Point(1, 1))),
                FOLD_COLORING.Create
            )
            await sleep(exponentialDelay(10))
            // fold.onDone()
            i++
        }

        // visualBoard.fold(
        //     1,
        //     FoldCoordinates.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
        //     FOLD_COLORING.Create
        // )
        // await sleep(1000)

        // visualBoard.fold(
        //     2,
        //     FoldCoordinates.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
        //     FOLD_COLORING.Create
        // )
        // await sleep(1000)

        // visualBoard.fold(
        //     3,
        //     FoldCoordinates.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
        //     FOLD_COLORING.Create
        // )
    }

    doFolds()

    return container
}
