import { easeOutBounce, cosineEase } from "./mathy/animation"
import { getGridDiagonals } from "./mathy/diagonal-lines"
import { Board } from "./board"
import { defineUnfoldFromBg, unfoldPlanToPath, type UnfoldPlan } from "./interact"
import paper from "paper"

/**
 * Pick one element at random from an array.
 */
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(array.length * Math.random())]
}

const GRID_LINES_COLOR = new paper.Color(0.95, 0.95, 0.95)
// const GRID_LINES_COLOR = new paper.Color(0, 0, 0)
const GRID_LINES_WIDTH = 0.05
const GRID_DOTS_COLOR = new paper.Color(0.8, 0.8, 0.8)
// const GRID_DOTS_COLOR = new paper.Color(0, 0, 0)
const GRID_DOTS_RADIUS = 0.065

class HingeProcess {
    start: paper.Point
    end: paper.Point
    startColor: paper.Color
    endColor: paper.Color
    flap: paper.Path
    tip: paper.Segment
    progress: number

    constructor(
        start: paper.Point,
        end: paper.Point,
        startColor: paper.Color,
        endColor: paper.Color,
        flap: paper.Path,
        tip: paper.Segment
    ) {
        this.start = start
        this.end = end
        this.startColor = startColor
        this.endColor = endColor
        this.flap = flap
        this.tip = tip
        this.progress = 0
    }

    onFrame() {
        // The cosine ease creates the effect of a triangle holding its shape, but
        // moving around a hinge and the out-bounce gives the effect of a flap
        // falling down and bouncing a bit.
        let animatedProgress = easeOutBounce(cosineEase(this.progress))
        this.tip.point = this.start.add(this.end.subtract(this.start).multiply(animatedProgress))
        if (animatedProgress < 0.5) {
            this.flap.fillColor = this.startColor
            // this.flap.strokeColor = this.startColor
        } else {
            this.flap.fillColor = this.endColor
            // this.flap.strokeColor = this.endColor
        }
    }

    onDone() {}
}

export class Game {
    private processes: HingeProcess[] = []
    board: Board
    gameLayer: paper.Layer
    lastTick: number = 0
    readonly tickInterval: number = 1 / 60

    constructor(board: Board, gameLayer: paper.Layer) {
        this.board = board
        this.gameLayer = gameLayer
    }

    onFrame(event: paper.Event & { delta: number; time: number }) {
        // Check if the time since the last tick is greater than the tick interval
        while (this.lastTick < event.time) {
            this.lastTick += this.tickInterval
            this.onTick()
        }

        for (let i = 0; i < this.processes.length; i++) {
            let process = this.processes[i]
            process.progress += event.delta
            process.onFrame()
            if (process.progress > 1) {
                process.onDone()
                this.processes.splice(i, 1)
                i--
                continue
            }
        }
    }

    randomlyRainSomewhere() {
        for (let attempt = 0; attempt < 10; attempt++) {
            let startVertex = randomChoice(this.board.lattice.allVertices())
            let rays = Board.validSquareRays(startVertex)
            let endVertex = startVertex.add(randomChoice(rays))
            let unfoldPlan = defineUnfoldFromBg(startVertex, endVertex)
            let newPolygon = unfoldPlanToPath(unfoldPlan)
            if (!this.board.pathInBounds(newPolygon)) {
                continue
            }
            if (!this.board.pathClear(newPolygon)) {
                continue
            }
            this.unfold(unfoldPlan)
            return
        }
    }

    onTick() {
        if (Math.random() < 0.05) {
            this.randomlyRainSomewhere()
        }
    }

    latticeTriangles: paper.Path[] = []

    unfold(plan: UnfoldPlan) {
        // draw the first triangle in black
        let newFirstTriangle = new paper.Path()
        newFirstTriangle.fillColor = new paper.Color(0, 0, 0, 0.5)
        // newFirstTriangle.strokeColor = new paper.Color(0, 0, 0, 0.5)
        // newFirstTriangle.strokeWidth = 0
        newFirstTriangle.add(plan.start)
        newFirstTriangle.add(plan.hinges[0])
        newFirstTriangle.add(plan.hinges[1])
        newFirstTriangle.closed = true
        // and draw the second triangle too, in white, but place the tip at start
        let newSecondTriangle = new paper.Path()
        newSecondTriangle.fillColor = new paper.Color(1, 1, 1, 0.5)
        // newSecondTriangle.strokeColor = new paper.Color(1, 1, 1, 0.5)
        // newSecondTriangle.strokeWidth = 0
        newSecondTriangle.add(plan.start)
        newSecondTriangle.add(plan.hinges[0])
        newSecondTriangle.add(plan.hinges[1])
        newSecondTriangle.closed = true

        let newPolygon = unfoldPlanToPath(plan)
        let newId = this.board.newShape(newPolygon)
        for (let triangle of this.latticeTriangles) {
            triangle.remove()
        }
        // this.latticeTriangles = []
        // for (let triangleIndex of this.board.lattice.allTriangleIndices()) {
        //     let state = this.board.lattice.getState(triangleIndex)
        //     // check if state is a number
        //     if (typeof state !== "number") {
        //         continue
        //     }
        //     let path = this.board.lattice.makeTrianglePolygon(triangleIndex)
        //     path.position = path.position.multiply(this.board.gridIncrement)
        //     path.scale(this.board.gridIncrement)
        //     path.fillColor = new paper.Color(1, 0, 1, 0.5)
        //     path.visible = true
        //     this.latticeTriangles.push(path)
        // }

        this.processes.push(
            new HingeProcess(
                plan.start,
                plan.end,
                new paper.Color(1, 1, 1, 0.5),
                new paper.Color(0, 0, 0, 0.5),
                newSecondTriangle,
                newSecondTriangle.segments[0]
            )
        )
    }

    drawGrid(board: Board) {
        let lines: [paper.Point, paper.Point][] = []
        // Horizontal lines
        for (let y = 0; y <= board.height; y++) {
            lines.push([new paper.Point(0, y), new paper.Point(board.width, y)])
        }
        // Vertical lines
        for (let x = 0; x <= board.width; x++) {
            lines.push([new paper.Point(x, 0), new paper.Point(x, board.height)])
        }
        // Diagonal lines
        for (let line of getGridDiagonals(board.width, board.height)) {
            lines.push(line)
        }
        // Draw the lines
        for (let line of lines) {
            let path = new paper.Path()
            path.moveTo(line[0])
            path.lineTo(line[1])
            path.strokeColor = GRID_LINES_COLOR
            path.strokeWidth = GRID_LINES_WIDTH
            this.gameLayer.addChild(path)
        }
        // Square corner dots
        for (let x = 0; x <= board.width; x++) {
            for (let y = 0; y <= board.height; y++) {
                let gridPoint = new paper.Point(x, y)
                let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
                path.fillColor = GRID_DOTS_COLOR
                this.gameLayer.addChild(path)
            }
        }
        // Square center dots
        for (let x = 0; x < board.width; x++) {
            for (let y = 0; y < board.height; y++) {
                let gridPoint = new paper.Point(x + 0.5, y + 0.5)
                let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
                path.fillColor = GRID_DOTS_COLOR
                this.gameLayer.addChild(path)
            }
        }
    }
}
