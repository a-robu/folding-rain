import paper from "paper"
import { Board } from "./board"
import { defineUnfoldFromBg, snapToDiagonalOrAALine } from "./interact"

const canvas = document.getElementById('canvas') as HTMLCanvasElement
paper.setup(canvas)

// Handle zoom
canvas.addEventListener("wheel", (event: WheelEvent) => {
    // LOL code copied from https://codepen.io/hichem147/pen/dExxNK
    let newZoom = paper.view.zoom; 
    let oldZoom = paper.view.zoom;
    if (event.deltaY > 0) {			
        newZoom = paper.view.zoom * 0.8;
    } else {
        newZoom = paper.view.zoom * 1.2;
    }
    let beta = oldZoom / newZoom;
    let mousePosition = new paper.Point(event.offsetX, event.offsetY);
    let viewPosition = paper.view.viewToProject(mousePosition);
    let mpos = viewPosition;
    let ctr = paper.view.center;
    let pc = mpos.subtract(ctr);
    let offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);	
    paper.view.zoom = newZoom;
    paper.view.center = paper.view.center.add(offset);

    event.preventDefault();
})

let boardLayer = new paper.Layer()
boardLayer.name = "board"
let uiLayer = new paper.Layer()
uiLayer.name = "ui"

let uiGraphics = {
    gridSelectionDot: new paper.Path.Circle(new paper.Point(0, 0), 4)
}

uiGraphics.gridSelectionDot.strokeColor = new paper.Color(0.5, 0.5, 0.5)
uiGraphics.gridSelectionDot.visible = false
uiLayer.addChild(uiGraphics.gridSelectionDot)

type ToolChoices = "pan" | "unfold"
let currentTool: ToolChoices = "pan"

// add keyboard shortcut to switch between pan and fold on keys 1 and 2
document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key == "1") {
        currentTool = "pan"
        panButton.classList.add('selected');
        foldButton.classList.remove('selected');
    } else if (event.key == "2") {
        currentTool = "unfold"
        foldButton.classList.add('selected');
        panButton.classList.remove('selected');
    }
})

const panButton = document.getElementById('panButton')!
const foldButton = document.getElementById('foldButton')!

panButton.addEventListener('click', () => {
    panButton.classList.add('selected');
    foldButton.classList.remove('selected');
    currentTool = "pan"
});

foldButton.addEventListener('click', () => {
    foldButton.classList.add('selected');
    panButton.classList.remove('selected');
    currentTool = "unfold"
})

function drawGrid(board: Board) {
    for (let y = 0; y < board.gridSize; y ++) {
        let path = new paper.Path()
        path.moveTo(new paper.Point(0, y * board.gridIncrement))
        path.lineTo(new paper.Point((board.gridSize - 1) * board.gridIncrement, y * board.gridIncrement))
        path.strokeColor = new paper.Color(0.95, 0.95, 0.95)
        path.strokeWidth = 1
        boardLayer.addChild(path)
    }

    for (let x = 0; x < board.gridSize; x ++) {
        let path = new paper.Path()
        path.moveTo(new paper.Point(x * board.gridIncrement, 0))
        path.lineTo(new paper.Point(x * board.gridIncrement, (board.gridSize - 1) * board.gridIncrement))
        path.strokeColor = new paper.Color(0.95, 0.95, 0.95)
        path.strokeWidth = 1
        boardLayer.addChild(path)
    }

    for (let x = 0; x < board.gridSize; x ++) {
        for (let y = 0; y < board.gridSize; y ++) {
            let gridPoint = new paper.Point(x, y)
            let path = new paper.Path.Circle(board.gridToPaperCoordinates(gridPoint), 1)
            path.fillColor = new paper.Color(0.8, 0.8, 0.8)
            path.strokeWidth = 1
            boardLayer.addChild(path)
        }
    }
}

let board = new Board(25)
drawGrid(board)


let dragLine = new paper.Path()
dragLine.visible = false

let dragFirstTriangle = new paper.Path()
dragFirstTriangle.visible = false
dragFirstTriangle.fillColor = new paper.Color(0.5, 0.5, 0.5)
dragFirstTriangle.opacity = 0.5
dragFirstTriangle.strokeWidth = 0

let dragSecondTriangle = new paper.Path()
dragSecondTriangle.visible = false
dragSecondTriangle.fillColor = new paper.Color(0.5, 0.5, 0.5)
dragSecondTriangle.opacity = 0.5
dragSecondTriangle.strokeWidth = 0


// Handle pan
let tool = new paper.Tool();
tool.onMouseDrag = function(event: paper.ToolEvent) {
    if (currentTool == "pan") {
        let pan_offset = event.point.subtract(event.downPoint);
        paper.view.center = paper.view.center.subtract(pan_offset);
    }
    else if (currentTool == "unfold") {
        let gridStart = board.paperToGridCoordinates(event.downPoint)
        let gridRequestedEnd = board.paperToGridCoordinates(event.point)
        let gridEnd = snapToDiagonalOrAALine(gridStart, gridRequestedEnd)
    
        let triangulisation = defineUnfoldFromBg(gridStart, gridEnd)
        dragFirstTriangle.visible = true
        dragFirstTriangle.removeSegments()
        dragFirstTriangle.moveTo(board.gridToPaperCoordinates(triangulisation.start))
        dragFirstTriangle.lineTo(board.gridToPaperCoordinates(triangulisation.hinges[0]))
        dragFirstTriangle.lineTo(board.gridToPaperCoordinates(triangulisation.hinges[1]))
        dragFirstTriangle.closePath()

        dragSecondTriangle.visible = true
        dragSecondTriangle.removeSegments()
        dragSecondTriangle.moveTo(board.gridToPaperCoordinates(triangulisation.hinges[0]))
        dragSecondTriangle.lineTo(board.gridToPaperCoordinates(triangulisation.hinges[1]))
        dragSecondTriangle.lineTo(board.gridToPaperCoordinates(triangulisation.end))
        dragSecondTriangle.closePath()

        dragLine.visible = true
        dragLine.removeSegments()
        dragLine.moveTo(board.gridToPaperCoordinates(triangulisation.hinges[0]))
        dragLine.lineTo(board.gridToPaperCoordinates(triangulisation.hinges[1]))
        dragLine.strokeColor = new paper.Color(0.5, 0.5, 0.5)
        dragLine.strokeWidth = 2
    }
}
tool.onMouseUp = function(_: paper.ToolEvent) {
    if (currentTool == "unfold") {
        dragLine.visible = false
    }
}
tool.onMouseMove = function(event: paper.ToolEvent) {
    // add a purple dot at the point matching the grid coordinate
    let gridPoint = board.paperToGridCoordinates(event.point)
    let snappedPoint = board.gridToPaperCoordinates(gridPoint)
    let isInBounds = board.isInBounds(gridPoint)
    uiGraphics.gridSelectionDot.visible = isInBounds
    if (isInBounds) {
        uiGraphics.gridSelectionDot.position = snappedPoint
    }
}

let bottomRightCorner = new paper.Point(board.gridSize - 1, board.gridSize - 1)
paper.view.center = board.gridToPaperCoordinates(bottomRightCorner).multiply(0.5)
