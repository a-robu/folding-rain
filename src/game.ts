import { easeOutBounce, cosineEase } from "./animation"
import type { Board } from "./board"
import type { UnfoldPlan } from "./interact"
import paper from "paper"

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
            this.flap.strokeColor = this.startColor
        }
        else {
            this.flap.fillColor = this.endColor
            this.flap.strokeColor = this.endColor
        }
    }

    onDone() {

    }
}

export class Game {
    private processes: HingeProcess[] = []
    board: Board
    gameLayer: paper.Layer

    constructor(board: Board, gameLayer: paper.Layer) {
        this.board = board
        this.gameLayer = gameLayer
    }


    onFrame(event: paper.Event & { delta: number }) {
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

    unfold(plan: UnfoldPlan) {
        // draw the first triangle in black
        let newFirstTriangle = new paper.Path()
        newFirstTriangle.fillColor = new paper.Color(0, 0, 0)
        newFirstTriangle.strokeColor = new paper.Color(0, 0, 0)
        newFirstTriangle.strokeWidth = 0.1
        newFirstTriangle.add(this.board.gridToPaperCoordinates(plan.start))
        newFirstTriangle.add(this.board.gridToPaperCoordinates(plan.hinges[0]))
        newFirstTriangle.add(this.board.gridToPaperCoordinates(plan.hinges[1]))
        newFirstTriangle.closed = true
        // and draw the second triangle too, in white, but place the tip at start
        let newSecondTriangle = new paper.Path()
        newSecondTriangle.fillColor = new paper.Color(1, 1, 1)
        newSecondTriangle.strokeColor = new paper.Color(1, 1, 1)
        newSecondTriangle.strokeWidth = 0.1
        newSecondTriangle.add(this.board.gridToPaperCoordinates(plan.start))
        newSecondTriangle.add(this.board.gridToPaperCoordinates(plan.hinges[0]))
        newSecondTriangle.add(this.board.gridToPaperCoordinates(plan.hinges[1]))
        newSecondTriangle.closed = true

        this.processes.push(new HingeProcess(
            this.board.gridToPaperCoordinates(plan.start),
            this.board.gridToPaperCoordinates(plan.end),
            new paper.Color(1, 1, 1),
            new paper.Color(0, 0, 0),
            newSecondTriangle,
            newSecondTriangle.segments[0]
        ))
    }

    drawGrid(board: Board) {
        for (let y = 0; y < board.height; y++) {
            let path = new paper.Path()
            path.moveTo(new paper.Point(0, y * board.gridIncrement))
            path.lineTo(new paper.Point((board.width - 1) * board.gridIncrement, y * board.gridIncrement))
            path.strokeColor = new paper.Color(0.95, 0.95, 0.95)
            path.strokeWidth = 1
            this.gameLayer.addChild(path)
        }
    
        for (let x = 0; x < board.width; x++) {
            let path = new paper.Path()
            path.moveTo(new paper.Point(x * board.gridIncrement, 0))
            path.lineTo(new paper.Point(x * board.gridIncrement, (board.height - 1) * board.gridIncrement))
            path.strokeColor = new paper.Color(0.95, 0.95, 0.95)
            path.strokeWidth = 1
            this.gameLayer.addChild(path)
        }
    
        for (let x = 0; x < board.width; x++) {
            for (let y = 0; y < board.height; y++) {
                let gridPoint = new paper.Point(x, y)
                let path = new paper.Path.Circle(board.gridToPaperCoordinates(gridPoint), 1)
                path.fillColor = new paper.Color(0.8, 0.8, 0.8)
                path.strokeWidth = 1
                this.gameLayer.addChild(path)
            }
        }
    }
}
