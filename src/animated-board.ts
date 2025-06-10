import paper from "paper"
import {
    type FoldTemplate,
    type FoldType,
    type ShapeChange,
    FOLD_TEMPLATES,
    FoldSpec,
    SHAPE_CHANGE
} from "@/lib/fold"
import { cosineEase, easeOutBounce } from "./lib/easing-functions"
import type PRNG from "random-seedable/@types/PRNG"
import randomColor from "randomcolor"

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
    shapes: Map<number, paper.Path> = new Map()
    private shapesLayer: paper.Layer
    private animationLayer: paper.Layer
    private runningAnimations: {
        animation: FoldAnimation
        finalizeAnimation: () => void
    }[] = []
    private random: PRNG
    onShapeUpdate = () => {}

    constructor(shapesLayer: paper.Layer, animationLayer: paper.Layer, random: PRNG) {
        this.shapesLayer = shapesLayer
        this.animationLayer = animationLayer
        this.random = random
    }

    private makePastelColor() {
        return randomColor({
            luminosity: "light",
            seed: this.random.int()
        })
    }

    onFrame(event: paper.Event & { delta: number; time: number }) {
        for (let i = 0; i < this.runningAnimations.length; i++) {
            let { animation, finalizeAnimation } = this.runningAnimations[i]
            animation.t += event.delta
            animation.onFrame()
            if (animation.progress > 1) {
                animation.onDone()
                finalizeAnimation()
                this.runningAnimations.splice(i, 1)
                i--
                continue
            }
        }
    }

    private determineFlapColor(shapeId: number, shapeChange: ShapeChange) {
        if (shapeChange == SHAPE_CHANGE.Remove) {
            return new paper.Color(1, 1, 1)
        }
        if (shapeChange == SHAPE_CHANGE.Add || shapeChange == SHAPE_CHANGE.Keep) {
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

    async fold(shapeId: number, foldSpec: FoldSpec, foldType: FoldType) {
        let triangles = foldSpec.toTriangles()
        let template = FOLD_TEMPLATES[foldType]
        this.applyTriangleUpdate(shapeId, triangles.near, template.near)
        await this.animateFlap(shapeId, foldSpec, template, () =>
            this.applyTriangleUpdate(shapeId, triangles.far, template.far)
        )
    }

    animateFlap(
        shapeId: number,
        foldSpec: FoldSpec,
        foldTemplate: FoldTemplate,
        onAnimationDone = () => {}
    ): Promise<void> {
        return new Promise(resolve => {
            let frontColor = this.determineFlapColor(shapeId, foldTemplate.near)
            let backColor = this.determineFlapColor(shapeId, foldTemplate.far)
            let flap = foldSpec.toTriangles().near.clone()
            this.animationLayer.addChild(flap)
            this.runningAnimations.push({
                animation: new FoldAnimation(
                    flap,
                    flap.segments[FoldSpec.triangleApexIndex],
                    new paper.Path([foldSpec.start, foldSpec.end]),
                    frontColor,
                    backColor,
                    foldSpec.start.getDistance(foldSpec.end)
                ),
                finalizeAnimation: () => {
                    onAnimationDone()
                    resolve()
                }
            })
        })
    }

    private applyTriangleUpdate(shapeId: number, triangle: paper.Path, shapeChange: ShapeChange) {
        console.log(
            "Applying triangle update:",
            shapeId,
            triangle.segments.map(s => [s.point.x, s.point.y]),
            shapeChange
        )
        if (shapeChange == SHAPE_CHANGE.Keep) {
            return
        }
        if (shapeChange == SHAPE_CHANGE.Remove) {
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
                result.reorient(false, true)
                this.shapes.set(shapeId, result)
                this.shapesLayer.addChild(result)
            }
        } else if (shapeChange == SHAPE_CHANGE.Add) {
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
                result.reorient(false, true)
                this.shapes.set(shapeId, result)
                this.shapesLayer.addChild(result)
                // shape.visible = false
                shape.remove()
            } else {
                // The shape does not exist, we create it
                console.log("Shape does not exist, creating it")
                let created = triangle.clone()
                created.reorient(false, true)
                created.fillColor = new paper.Color(this.makePastelColor())
                this.shapes.set(shapeId, created)
                this.shapesLayer.addChild(created)
            }
        } else {
            throw new Error("Unrecognized color transition: " + `${shapeChange}`)
        }
        this.onShapeUpdate()
    }
}
