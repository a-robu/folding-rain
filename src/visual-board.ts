import paper from "paper"
import randomColor from "randomcolor"
import {
    FOLD_COLORING_TEMPLATES,
    FoldCoordinates,
    type CellTransition,
    type FoldColoring,
    type FoldColoringChoice
} from "./lib/fold"
import { CELL_STATE, type CellState } from "./lib/cell"
import { cosineEase, easeOutBounce } from "./lib/animation"

function pastel() {
    let color = randomColor({
        luminosity: "light",
        seed: pastel.seed
    })
    pastel.seed += 1
    return color
}
pastel.seed = 0

class FoldAnimation {
    flap: paper.Path
    tip: paper.Segment
    apexTrajectory: paper.Path
    frontColor: paper.Color
    backColor: paper.Color
    t: number
    duration: number

    constructor(
        flap: paper.Path,
        tip: paper.Segment,
        apexTrajectory: paper.Path,
        frontColor: paper.Color,
        backColor: paper.Color,
        duration: number
    ) {
        this.flap = flap
        this.tip = tip
        this.apexTrajectory = apexTrajectory
        this.frontColor = frontColor
        this.backColor = backColor
        this.t = 0
        this.duration = duration
    }

    get progress() {
        return this.t / this.duration
    }

    private brighten(color: paper.Color, progress: number) {
        // Function which maps 0 -> 0, 0.5 -> 1, 1 -> 0
        let triangleFunction = (x: number) => {
            if (x < 0) return 0
            if (x > 1) return 0
            return 1 - Math.abs(x - 0.5) * 2
        }
        let newColor = color.clone()
        let changeAmount = 0.3
        newColor.lightness =
            color.lightness +
            (color.lightness < changeAmount ? 1 : -1) * changeAmount * triangleFunction(progress)
        return newColor
    }

    onFrame() {
        // The cosine ease creates the effect of a triangle holding its shape, but
        // moving around a hinge and the out-bounce gives the effect of a flap
        // falling down and bouncing a bit.
        let animatedProgress = easeOutBounce(cosineEase(this.progress))

        this.tip.point = this.apexTrajectory.getPointAt(
            this.apexTrajectory.length * animatedProgress
        )
        if (animatedProgress < 0.5) {
            this.flap.fillColor = this.brighten(this.frontColor, animatedProgress)
        } else {
            this.flap.fillColor = this.brighten(this.backColor, animatedProgress)
        }
    }

    onDone() {
        this.flap.remove()
    }
}

export class AnimatedBoard {
    private shapes: Map<number, paper.Path> = new Map()
    private shapesLayer: paper.Layer
    private animationLayer: paper.Layer
    private runningAnimations: {
        animation: FoldAnimation
        callback: () => void
    }[] = []

    constructor(shapesLayer: paper.Layer, animationLayer: paper.Layer) {
        this.shapesLayer = shapesLayer
        this.animationLayer = animationLayer
    }

    onFrame(event: paper.Event & { delta: number; time: number }) {
        for (let i = 0; i < this.runningAnimations.length; i++) {
            let { animation, callback } = this.runningAnimations[i]
            animation.t += event.delta
            animation.onFrame()
            if (animation.progress > 1) {
                animation.onDone()
                callback()
                this.runningAnimations.splice(i, 1)
                i--
                continue
            }
        }
    }

    private deriveFlapColor(shapeId: number, state: CellState) {
        if (state == CELL_STATE.Background) {
            return new paper.Color(1, 1, 1)
        }
        if (state == CELL_STATE.Shape) {
            let shape = this.shapes.get(shapeId)
            if (!shape) {
                throw new Error(`Shape with ID ${shapeId} does not exist`)
            }
            if (shape.fillColor == null) {
                throw new Error(`Shape with ID ${shapeId} has no fill color`)
            }
            return shape.fillColor
        }
        throw new Error("Invalid state")
    }

    fold(shapeId: number, foldPoints: FoldCoordinates, foldColoring: FoldColoringChoice) {
        let triangles = foldPoints.toTriangles()
        let coloringTemplate = FOLD_COLORING_TEMPLATES[foldColoring]
        this.applyTriangleUpdate(shapeId, triangles.near, coloringTemplate.near)
        this.animateFlap(shapeId, foldPoints, coloringTemplate, () => {
            this.applyTriangleUpdate(shapeId, triangles.far, coloringTemplate.far)
        })
    }

    animateFlap(
        shapeId: number,
        foldPoints: FoldCoordinates,
        coloringTemplate: FoldColoring,
        callback: () => void
    ) {
        let frontColor = this.deriveFlapColor(shapeId, coloringTemplate.near.before)
        let backColor = this.deriveFlapColor(shapeId, coloringTemplate.far.after)
        let flap = foldPoints.toTriangles().near.clone()
        this.animationLayer.addChild(flap)
        this.runningAnimations.push({
            animation: new FoldAnimation(
                flap,
                flap.segments[FoldCoordinates.triangleApexIndex],
                new paper.Path([foldPoints.start, foldPoints.end]),
                frontColor,
                backColor,
                foldPoints.start.getDistance(foldPoints.end)
            ),
            callback: callback
        })
    }

    private applyTriangleUpdate(
        shapeId: number,
        triangle: paper.Path,
        colorTransition: CellTransition
    ) {
        console.log(
            "Applying triangle update:",
            shapeId,
            triangle.segments.map(s => [s.point.x, s.point.y]),
            colorTransition
        )
        if (colorTransition.after == null) {
            return
        }
        if (
            colorTransition.before == CELL_STATE.Shape &&
            colorTransition.after == CELL_STATE.Background
        ) {
            // A triangle is being removed from a shape
            console.log("Removing triangle from shape with ID:", shapeId)
            let shape = this.shapes.get(shapeId)
            if (!shape) {
                throw new Error(`Shape with ID ${shapeId} does not exist`)
            }
            let result = shape.subtract(triangle) as paper.Path
            if (result.segments.length == 0) {
                // It shrunk to nothingless, bye
                console.log("Shape shrunk to nothing, removing it")
                this.shapes.delete(shapeId)
                shape.remove()
                result.remove()
            } else {
                // Swap the old shape with the new one that was created
                console.log(
                    "Shape shrunk after removing triangle, updating it, #segments:",
                    `${shape.segments.length} -> ${result.segments.length}`
                )
                shape.remove()
                this.shapes.set(shapeId, result)
                this.shapesLayer.addChild(result)
            }
        } else if (
            colorTransition.before == CELL_STATE.Background &&
            colorTransition.after == CELL_STATE.Shape
        ) {
            // A triangle is being added to a shape
            console.log("Adding triangle to shape with ID:", shapeId)
            let shape = this.shapes.get(shapeId)
            if (shape) {
                // The shape already exists, we just add the triangle to it
                console.log("Shape already exists, uniting with triangle")
                let result = shape.unite(triangle) as paper.Path
                console.log(
                    "Shape grew after adding triangle, updating it, #segments:",
                    `${shape.segments.length} -> ${result.segments.length}`
                )
                this.shapes.set(shapeId, result)
                this.shapesLayer.addChild(result)
                // shape.visible = false
                shape.remove()
            } else {
                // The shape does not exist, we create it
                console.log("Shape does not exist, creating it")
                let created = triangle.clone()
                created.fillColor = new paper.Color(pastel())
                this.shapes.set(shapeId, created)
                this.shapesLayer.addChild(created)
            }
        } else {
            throw new Error(
                "Unrecognized color transition: " +
                    `${colorTransition.before} -> ${colorTransition.after}`
            )
        }
    }
}
