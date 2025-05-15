import { easeOutBounce, cosineEase } from "./lib/animation"
import { getGridDiagonals } from "./lib/diagonal-lines"
import { Board } from "./board"
import { createUnfoldPlan, makePathFromUnfoldPlan, type UnfoldPlan } from "./interact"
import paper from "paper"
import randomColor from "randomcolor"

/**
 * Pick one element at random from an array.
 */
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(array.length * Math.random())]
}

/**
 * Pick one element at random from an array, using a probability distribution.
 * @param array The array of elements to choose from.
 * @param probabilities An array of probabilities corresponding to each element. Must sum to 1.
 */
function randomChoiceWeighted<T>(array: T[], probabilities: number[]): T {
    if (array.length !== probabilities.length) {
        throw new Error("Array and probabilities must have the same length")
    }
    let r = Math.random()
    let cumulative = 0
    for (let i = 0; i < array.length; i++) {
        cumulative += probabilities[i]
        if (r < cumulative) {
            return array[i]
        }
    }
    // Fallback in case of floating point error
    return array[array.length - 1]
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
    t: number
    duration: number

    constructor(
        start: paper.Point,
        end: paper.Point,
        startColor: paper.Color,
        endColor: paper.Color,
        flap: paper.Path,
        tip: paper.Segment,
        duration: number
    ) {
        this.start = start
        this.end = end
        this.startColor = startColor
        this.endColor = endColor
        this.flap = flap
        this.tip = tip
        this.t = 0
        this.duration = duration
    }

    get progress() {
        return this.t / this.duration
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
    auto: boolean

    constructor(board: Board, gameLayer: paper.Layer, auto = false) {
        this.board = board
        this.gameLayer = gameLayer
        this.auto = auto
    }

    onFrame(event: paper.Event & { delta: number; time: number }) {
        // Check if the time since the last tick is greater than the tick interval
        while (this.lastTick < event.time) {
            this.lastTick += this.tickInterval
            this.onTick()
        }

        for (let i = 0; i < this.processes.length; i++) {
            let process = this.processes[i]
            process.t += event.delta
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
            let rayLength = randomChoiceWeighted(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                [0.15, 0.4, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]
            )
            let endVertex = startVertex.add(randomChoice(rays).multiply(rayLength))
            let unfoldPlan = createUnfoldPlan(startVertex, endVertex)
            let newPolygon = makePathFromUnfoldPlan(unfoldPlan)
            if (!this.board.pathInBounds(newPolygon)) {
                continue
            }
            if (!this.board.pathClear(newPolygon)) {
                continue
            }
            if (!this.board.perimeterIsClear(newPolygon)) {
                continue
            }
            this.unfold(unfoldPlan)
            break
        }
    }

    randomlyUnfoldAFlap() {
        for (let attempt = 0; attempt < 10; attempt++) {
            let shapeIds = this.board.allShapesIds()
            if (shapeIds.length == 0) {
                continue
            }
            let id = randomChoice(shapeIds)
            let edge = randomChoice(this.board.getShapeEdges(id))
            let unfoldPlanAndId = this.board.detectSideUnfold(edge)
            if (!unfoldPlanAndId) {
                continue
            }
            let unfoldPlan = unfoldPlanAndId.unfoldPlan
            let newPolygon = makePathFromUnfoldPlan(unfoldPlan)
            if (!this.board.pathInBounds(newPolygon)) {
                continue
            }
            // if (!this.board.pathClear(newPolygon)) {
            //     continue
            // }
            console.log("Unfolding flap", unfoldPlan)
            this.unfold(unfoldPlan)
        }
    }

    onTick() {
        if (this.auto) {
            // if (Math.random() < 0.01) {
            if (Math.random() < 0.1) {
                this.randomlyRainSomewhere()
            }
            if (Math.random() < 0.3) {
                // if (Math.random() < 0.03) {
                this.randomlyUnfoldAFlap()
            }
        }
    }

    latticeTriangles: paper.Path[] = []

    unfold(plan: UnfoldPlan) {
        let ultimateColor = new paper.Color(
            randomColor({
                luminosity: "light"
            })
        )

        // draw the first triangle in black
        let newFirstTriangle = new paper.Path()
        newFirstTriangle.fillColor = ultimateColor
        // newFirstTriangle.strokeColor = new paper.Color(0, 0, 0, 0.5)
        // newFirstTriangle.strokeWidth = 0
        newFirstTriangle.add(plan.start)
        newFirstTriangle.add(plan.hinges[0])
        newFirstTriangle.add(plan.hinges[1])
        newFirstTriangle.closed = true
        // and draw the second triangle too, in white, but place the tip at start
        let newSecondTriangle = new paper.Path()
        newSecondTriangle.fillColor = new paper.Color(1, 1, 1)
        // newSecondTriangle.strokeColor = new paper.Color(1, 1, 1)
        // newSecondTriangle.strokeWidth = 0
        newSecondTriangle.add(plan.start)
        newSecondTriangle.add(plan.hinges[0])
        newSecondTriangle.add(plan.hinges[1])
        newSecondTriangle.closed = true

        let newPolygon = makePathFromUnfoldPlan(plan)
        /*let newId = */ this.board.newShape(newPolygon)
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
                new paper.Color(1, 1, 1),
                ultimateColor,
                newSecondTriangle,
                newSecondTriangle.segments[0],
                plan.end.subtract(plan.start).length
            )
        )
    }

    drawGrid(layer: paper.Layer) {
        let lines: [paper.Point, paper.Point][] = []
        // Horizontal lines
        for (let y = 0; y <= this.board.height; y++) {
            lines.push([new paper.Point(0, y), new paper.Point(this.board.width, y)])
        }
        // Vertical lines
        for (let x = 0; x <= this.board.width; x++) {
            lines.push([new paper.Point(x, 0), new paper.Point(x, this.board.height)])
        }
        // Diagonal lines
        for (let line of getGridDiagonals(this.board.width, this.board.height)) {
            lines.push(line)
        }
        // Draw the lines
        for (let line of lines) {
            let path = new paper.Path()
            path.moveTo(line[0])
            path.lineTo(line[1])
            path.strokeColor = GRID_LINES_COLOR
            path.strokeWidth = GRID_LINES_WIDTH
            layer.addChild(path)
        }
        // Square corner dots
        for (let x = 0; x <= this.board.width; x++) {
            for (let y = 0; y <= this.board.height; y++) {
                let gridPoint = new paper.Point(x, y)
                let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
                path.fillColor = GRID_DOTS_COLOR
                layer.addChild(path)
            }
        }
        // Square center dots
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.height; y++) {
                let gridPoint = new paper.Point(x + 0.5, y + 0.5)
                let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
                path.fillColor = GRID_DOTS_COLOR
                layer.addChild(path)
            }
        }
    }
}
