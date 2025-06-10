import paper from "paper"
import {
    type FoldTemplate,
    type FoldAction,
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
    initialColor: paper.Color
    subsequentColor: paper.Color
    t: number
    duration: number

    constructor(
        flap: paper.Path,
        tip: paper.Segment,
        apexTrajectory: paper.Path,
        initialColor: paper.Color,
        subsequentColor: paper.Color,
        duration: number
    ) {
        this.flap = flap
        this.tip = tip
        this.apexTrajectory = apexTrajectory
        this.initialColor = initialColor
        this.subsequentColor = subsequentColor
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
            this.flap.fillColor = this.brighten(this.initialColor, animatedProgress)
        } else {
            this.flap.fillColor = this.brighten(this.subsequentColor, animatedProgress)
        }
    }

    onDone() {
        this.flap.remove()
    }
}

export class AnimatedBoard {
    shapes: Map<number, paper.Path> = new Map()
    private shapesLayer: paper.Layer
    lockShapes: paper.Group = new paper.Group()
    private animationLayer: paper.Layer
    private runningAnimations: {
        animation: FoldAnimation
        finalizeAnimation: () => void
    }[] = []
    private random: PRNG
    private shapeUpdateListeners: Array<() => void> = []
    /**
     * @deprecated Use addShapeUpdateListener instead
     */
    onShapeUpdate = () => {}

    constructor(shapesLayer: paper.Layer, animationLayer: paper.Layer, random: PRNG) {
        this.shapesLayer = shapesLayer
        this.animationLayer = animationLayer
        this.random = random
    }

    addShapeUpdateListener(listener: () => void) {
        this.shapeUpdateListeners.push(listener)
    }
    removeShapeUpdateListener(listener: () => void) {
        this.shapeUpdateListeners = this.shapeUpdateListeners.filter(l => l !== listener)
    }
    private notifyShapeUpdateListeners() {
        for (const listener of this.shapeUpdateListeners) {
            listener()
        }
        this.onShapeUpdate()
    }

    private makePastelColor() {
        return randomColor({
            luminosity: "light",
            seed: this.random.int()
        })
    }

    findPolygonContacts(shape: paper.Path) {
        let existingShapeIds = []
        let lockShapeIds = []
        for (let existingShape of this.shapes.values()) {
            if (
                existingShape.intersects(shape) ||
                existingShape.contains(shape.segments[0].point)
            ) {
                let id = existingShape.data.id
                if (id == null) {
                    throw new Error("Shape does not have an ID")
                }
                existingShapeIds.push(existingShape.data.id)
            }
        }
        for (let lockShape of this.lockShapes.children) {
            if (lockShape.intersects(shape) || lockShape.contains(shape.segments[0].point)) {
                let id = lockShape.data.id
                if (id == null) {
                    throw new Error("Lock shape does not have an ID")
                }
                lockShapeIds.push(lockShape.data.id)
            }
        }
        return {
            shapeIds: existingShapeIds,
            lockShapeIds: lockShapeIds
        }
    }

    findPointContacts(point: paper.Point) {
        let existingShapeIds = []
        let lockShapeIds = []
        for (let existingShape of this.shapes.values()) {
            if (existingShape.contains(point)) {
                let id = existingShape.data.id
                if (id == null) {
                    throw new Error("Shape does not have an ID")
                }
                existingShapeIds.push(existingShape.data.id)
            }
        }
        for (let lockShape of this.lockShapes.children) {
            if (lockShape.contains(point)) {
                let id = lockShape.data.id
                if (id == null) {
                    throw new Error("Lock shape does not have an ID")
                }
                lockShapeIds.push(lockShape.data.id)
            }
        }
        return {
            shapeIds: existingShapeIds,
            lockShapeIds: lockShapeIds
        }
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

    private determineFlapColors(shapeId: number, shapeChange: ShapeChange) {
        let shape = this.shapes.get(shapeId)
        if (!shape) {
            throw new Error(`Shape with ID ${shapeId} does not exist`)
        }
        if (shape.fillColor == null) {
            throw new Error(`Shape with ID ${shapeId} has no fill color`)
        }
        if (shapeChange == SHAPE_CHANGE.Remove) {
            return [shape.fillColor, new paper.Color(1, 1, 1)]
        }
        if (shapeChange == SHAPE_CHANGE.Add) {
            return [new paper.Color(1, 1, 1), shape.fillColor]
        } else if (shapeChange == SHAPE_CHANGE.Keep) {
            return [shape.fillColor, shape.fillColor]
        }
        throw new Error("Invalid state")
    }

    async fold(shapeId: number, foldSpec: FoldSpec, foldAction: FoldAction) {
        let triangles = foldSpec.toTriangles()
        let template = FOLD_TEMPLATES[foldAction]
        this.applyTriangleUpdate(shapeId, triangles.near, template.near)
        let lockShape = triangles.far.clone()
        lockShape.data.id = shapeId
        this.lockShapes.addChild(lockShape)
        this.notifyShapeUpdateListeners()
        await this.animateFlap(shapeId, foldSpec, template, () => {
            this.applyTriangleUpdate(shapeId, triangles.far, template.far)
            lockShape.remove()
            this.notifyShapeUpdateListeners()
        })
    }

    animateFlap(
        shapeId: number,
        foldSpec: FoldSpec,
        foldTemplate: FoldTemplate,
        onAnimationDone = () => {}
    ): Promise<void> {
        return new Promise(resolve => {
            let [initiallyVisible, subsequentlyVisible] = this.determineFlapColors(
                shapeId,
                foldTemplate.near
            )
            let flap = foldSpec.toTriangles().near.clone()
            this.animationLayer.addChild(flap)
            this.runningAnimations.push({
                animation: new FoldAnimation(
                    flap,
                    flap.segments[FoldSpec.triangleApexIndex],
                    new paper.Path([foldSpec.start, foldSpec.end]),
                    initiallyVisible,
                    subsequentlyVisible,
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
                created.data.id = shapeId
                this.shapes.set(shapeId, created)
                this.shapesLayer.addChild(created)
            }
        } else {
            throw new Error("Unrecognized color transition: " + `${shapeChange}`)
        }
        // At the end of this method, after any shape changes:
        this.notifyShapeUpdateListeners()
    }
}
