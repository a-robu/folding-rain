import paper from "paper"
import { Board } from "./board"
import { Game } from "./game"
import { GUI } from "./gui"

const canvas = document.getElementById('canvas') as HTMLCanvasElement
paper.setup(canvas)

let gameLayer = new paper.Layer()
gameLayer.name = "board"
let uiLayer = new paper.Layer()
uiLayer.name = "ui"

let board = new Board(5, 5)
let game = new Game(board, gameLayer)
let guiTool = new paper.Tool();
let panButton = document.getElementById("panButton")
if (!panButton) {
    throw new Error("Pan button not found")
}
let foldButton = document.getElementById("foldButton")
if (!foldButton) {
    throw new Error("Fold button not found")
}
let gui = new GUI(board, game, uiLayer, paper.view, panButton, foldButton) 
// Wire up all the event listeners to the GUI
guiTool.onMouseDrag = gui.onMouseDrag.bind(gui)
guiTool.onMouseUp = gui.onMouseUp.bind(gui)
guiTool.onMouseMove = gui.onMouseMove.bind(gui)
document.addEventListener("keydown", gui.onKeyDown.bind(gui))
canvas.addEventListener("wheel", gui.onWheel.bind(gui))

game.drawGrid(board)
paper.view.zoom = 100
// paper.view.rotate(45)
paper.view.onFrame = game.onFrame.bind(game)

gui.centerView()