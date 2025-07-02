import paper from "paper"
import {
    type FoldTemplate,
    type FoldAction,
    type ShapeChange,
    FOLD_TEMPLATES,
    FoldSpec,
    SHAPE_CHANGE,
    FOLD_ACTION
} from "@/lib/fold-spec"
import { isOnGrid, roundToGrid } from "@/lib/grid"
import { FoldAnimation } from "@/fold-animation"

const BACKGROUND_COLOR = new paper.Color(1, 1, 1)
const SHAPE_COLOR = new paper.Color(0, 0, 0)

export class Board {
    shapes: Map<number, paper.Path> = new Map()
    private shapesGroup: paper.Group = new paper.Group({ insert: false })
    lockShapes: paper.Group = new paper.Group({ insert: false })
    private animationGroup: paper.Group = new paper.Group({ insert: false })
    paperGroup: paper.Group = new paper.Group({
        insert: false,
        children: [this.shapesGroup, this.animationGroup]
    })
    private runningAnimations: {
        animation: FoldAnimation
        finalizeAnimation: () => void
    }[] = []
    // private random: PRNG
    private shapeUpdateListeners: Array<() => void> = []
    speedFactor = 1

    // constructor(shapesLayer: paper.Layer, animationLayer: paper.Layer) {//, random: PRNG) {
    //     this.shapesLayer = shapesLayer
    //     this.animationLayer = animationLayer
    //     // this.random = random
    // }

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
    }

    // private makePastelColor() {
    //     return randomColor({
    //         luminosity: "light",
    //         seed: this.random.int()
    //     })
    // }

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
            animation.t += event.delta * this.speedFactor
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

    private determineFlapColors(
        shapeId: number,
        foldTemplate: FoldTemplate
    ): {
        initiallyVisible: paper.Color
        subsequentlyVisible: paper.Color
    } {
        let shape = this.shapes.get(shapeId)
        if (!shape) {
            throw new Error(`Shape with ID ${shapeId} does not exist`)
        }
        if (shape.fillColor == null) {
            throw new Error(`Shape with ID ${shapeId} has no fill color`)
        }
        return {
            initiallyVisible:
                foldTemplate.near == SHAPE_CHANGE.Add ? BACKGROUND_COLOR : shape.fillColor,
            subsequentlyVisible:
                foldTemplate.far == SHAPE_CHANGE.Remove ? BACKGROUND_COLOR : shape.fillColor
        }
    }

    foldInstantaneously(shapeId: number, foldSpec: FoldSpec, foldAction: FoldAction) {
        return this.foldSyncOrAsync(shapeId, foldSpec, foldAction, true)
    }

    async foldAsync(shapeId: number, foldSpec: FoldSpec, foldAction: FoldAction) {
        return this.foldSyncOrAsync(shapeId, foldSpec, foldAction, false)
    }

    private async foldSyncOrAsync(
        shapeId: number,
        foldSpec: FoldSpec,
        foldAction: FoldAction,
        instantaneous: boolean
    ) {
        let triangles = foldSpec.toTriangles()
        let template = FOLD_TEMPLATES[foldAction]
        this.applyTriangleUpdate(
            shapeId,
            triangles.near,
            template.near,
            foldAction == FOLD_ACTION.Remove
        )
        let nearLockShape = triangles.near.clone()
        nearLockShape.data.id = shapeId
        this.shapesGroup.addChild(nearLockShape)
        this.lockShapes.addChild(nearLockShape)
        let farLockShape = triangles.far.clone()
        farLockShape.data.id = shapeId
        this.shapesGroup.addChild(farLockShape)
        this.lockShapes.addChild(farLockShape)
        this.notifyShapeUpdateListeners()
        function onComplete(board: Board) {
            board.applyTriangleUpdate(
                shapeId,
                triangles.far,
                template.far,
                foldAction == FOLD_ACTION.Remove
            )
            farLockShape.remove()
            nearLockShape.remove()
            board.notifyShapeUpdateListeners()
        }
        if (instantaneous) {
            onComplete(this)
        } else {
            await this.animateFlap(shapeId, foldSpec, template, () => {
                onComplete(this)
            })
        }
    }

    animateFlap(
        shapeId: number,
        foldSpec: FoldSpec,
        foldTemplate: FoldTemplate,
        onAnimationDone = () => {}
    ): Promise<void> {
        return new Promise(resolve => {
            let { initiallyVisible, subsequentlyVisible } = this.determineFlapColors(
                shapeId,
                foldTemplate
            )
            let flap = foldSpec.toTriangles().near.clone()
            this.animationGroup.addChild(flap)
            this.runningAnimations.push({
                animation: new FoldAnimation(
                    flap,
                    flap.segments[FoldSpec.triangleApexIndex],
                    new paper.Path({ insert: false, segments: [foldSpec.start, foldSpec.end] }),
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

    private applyTriangleUpdate(
        shapeId: number,
        triangle: paper.Path,
        shapeChange: ShapeChange,
        expectRemoval = false
    ) {
        for (let segment of triangle.segments) {
            if (!isOnGrid(segment.point)) {
                throw new Error(`Triangle segment point ${segment.point} is not on the grid`)
            }
        }
        if (shapeChange == SHAPE_CHANGE.Keep) {
            return
        }
        if (shapeChange == SHAPE_CHANGE.Remove) {
            // A triangle is being removed from a shape
            let shape = this.shapes.get(shapeId)
            if (!shape) {
                throw new Error(`Shape with ID ${shapeId} does not exist`)
            }
            let result = shape.subtract(triangle) as paper.Path
            if (result.segments.length == 0) {
                // It shrunk to nothingless, bye
                this.shapes.delete(shapeId)
                shape.remove()
                result.remove()
                console.log(`Shape with ID ${shapeId} removed`)
            } else {
                // Swap the old shape with the new one that was created
                shape.remove()
                result.reorient(false, true)
                result.flatten(0.1)
                this.shapes.set(shapeId, result)
                this.shapesGroup.addChild(result)
            }
        } else if (shapeChange == SHAPE_CHANGE.Add) {
            // A triangle is being added to a shape
            let shape = this.shapes.get(shapeId)
            if (shape) {
                // The shape already exists, we just add the triangle to it
                let result = shape.unite(triangle) as paper.Path
                result.reorient(false, true)
                result.flatten(0.1)
                this.shapes.set(shapeId, result)
                this.shapesGroup.addChild(result)
                // shape.visible = false
                shape.remove()
            } else {
                // The shape does not exist, we create it
                let created = triangle.clone()
                created.reorient(false, true)
                created.flatten(0.1)
                // created.fillColor = new paper.Color(this.makePastelColor())
                created.fillColor = SHAPE_COLOR
                created.data.id = shapeId
                // created.fillColor.alpha = 0.5 // Semi-transparent
                created.data.board = this
                this.shapes.set(shapeId, created)
                this.shapesGroup.addChild(created)
            }
        } else {
            throw new Error("Unrecognized color transition: " + `${shapeChange}`)
        }
        let shape = this.shapes.get(shapeId)
        if (shape == null) {
            if (!expectRemoval) {
                throw new Error(`Shape with ID ${shapeId} does not exist after applying update`)
            }
        } else {
            for (let segment of shape.segments) {
                if (!isOnGrid(segment.point)) {
                    segment.point = roundToGrid(segment.point)
                }
            }
        }
        // At the end of this method, after any shape changes:
        this.notifyShapeUpdateListeners()
    }

    addShape(id: number, path: paper.Path) {
        if (this.shapes.has(id)) {
            throw new Error(`Shape with ID ${id} already exists`)
        }
        let shape = path.clone()
        shape.closed = true
        shape.reorient(false, true)
        shape.data.id = id
        shape.data.board = this
        if (!shape.fillColor) {
            // shape.fillColor = new paper.Color(this.makePastelColor())
            shape.fillColor = SHAPE_COLOR
        }
        this.shapes.set(id, shape)
        this.shapesGroup.addChild(shape)
        this.notifyShapeUpdateListeners()
        return shape
    }
}
