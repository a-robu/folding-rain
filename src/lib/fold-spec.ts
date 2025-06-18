import paper from "paper"
import { isOnGrid, roundToGrid } from "./grid"

export const SIDE = {
    Near: "Near",
    Far: "Far"
}
export type Side = keyof typeof SIDE

export const SHAPE_CHANGE = {
    Add: "Add",
    Remove: "Remove",
    Keep: "Keep"
} as const
export type ShapeChange = keyof typeof SHAPE_CHANGE

export type FoldTemplate = {
    near: ShapeChange
    far: ShapeChange
}

export const FOLD_ACTION = {
    Create: "Create",
    Remove: "Remove",
    Expand: "Expand",
    Contract: "Contract"
} as const
export type FoldAction = keyof typeof FOLD_ACTION

export const FOLD_TEMPLATES: Record<FoldAction, FoldTemplate> = {
    [FOLD_ACTION.Create]: {
        near: SHAPE_CHANGE.Add,
        far: SHAPE_CHANGE.Add
    },
    [FOLD_ACTION.Remove]: {
        near: SHAPE_CHANGE.Remove,
        far: SHAPE_CHANGE.Remove
    },
    [FOLD_ACTION.Expand]: {
        near: SHAPE_CHANGE.Keep,
        far: SHAPE_CHANGE.Add
    },
    [FOLD_ACTION.Contract]: {
        near: SHAPE_CHANGE.Remove,
        far: SHAPE_CHANGE.Keep
    }
}

export const FOLD_COVER = {
    Full: "Full",
    Left: "Left",
    Right: "Right"
}
export type FoldCover = (typeof FOLD_COVER)[keyof typeof FOLD_COVER]
export const FOLD_COVERS = Object.values(FOLD_COVER)

/**
 * Represents a shape with four vertices and an axis of symmetry
 * between two of them. The axis of symmetry forms a hinge around
 * which the start point moves to fold over to the end point.
 */
export class FoldSpec {
    start: paper.Point
    hinges: [paper.Point, paper.Point]
    end: paper.Point

    constructor(start: paper.Point, hinges: [paper.Point, paper.Point], end: paper.Point) {
        this.start = start
        this.hinges = hinges
        this.end = end
    }

    equals(other: FoldSpec): boolean {
        return (
            this.start.equals(other.start) &&
            ((this.hinges[0].equals(other.hinges[0]) && this.hinges[1].equals(other.hinges[1])) ||
                (this.hinges[0].equals(other.hinges[1]) &&
                    this.hinges[1].equals(other.hinges[0]))) &&
            this.end.equals(other.end)
        )
    }

    transform(transform: paper.Matrix) {
        return new FoldSpec(
            this.start.transform(transform),
            [this.hinges[0].transform(transform), this.hinges[1].transform(transform)],
            this.end.transform(transform)
        )
    }

    reverse() {
        return new FoldSpec(this.end, [this.hinges[1], this.hinges[0]], this.start)
    }

    key() {
        return [
            this.start.x,
            this.start.y,
            this.hinges[0].x,
            this.hinges[0].y,
            this.hinges[1].x,
            this.hinges[1].y,
            this.end.x,
            this.end.y
        ].join(",")
    }

    /**
     * Defines a fold of two right-isosceles triangles sitting back to back,
     * given their apex points. Assumes the inputs are valid, meaning
     * non-equal, grid-aligned points. Throws an error if they are not.
     * Also throws an error if the produced hinges are not valid.
     * The first hinge will be in the clockwise direction from the start point,
     * and the second hinge will be in the counter-clockwise direction.
     */
    static fromEndPoints(start: paper.Point, end: paper.Point, foldCover: FoldCover): FoldSpec {
        if (!isOnGrid(start) || !isOnGrid(end)) {
            throw new Error(
                "One or both coordinates are invalid: " +
                    `start=(${start.x}, ${start.y}), end=(${end.x}, ${end.y})`
            )
        }

        // Check that the start and end are not the same points
        if (start.equals(end)) {
            throw new Error(`Start and end points are the same: (${start.x}, ${start.y})`)
        }

        // We assume the input defines a valid (grid-aligned) square.
        // So we just add the other two corners.
        let vector = end.subtract(start)
        let midpoint = start.add(vector.multiply(0.5))
        let leftCorner = roundToGrid(
            midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
        )
        let rightCorner = roundToGrid(
            midpoint.add(vector.multiply(0.5).rotate(90, new paper.Point(0, 0)))
        )

        let hinges: [paper.Point, paper.Point]
        if (foldCover === FOLD_COVER.Full) {
            hinges = [leftCorner, rightCorner]
        } else if (foldCover === FOLD_COVER.Left) {
            hinges = [leftCorner, midpoint]
        } else if (foldCover === FOLD_COVER.Right) {
            hinges = [midpoint, rightCorner]
        } else {
            throw new Error(`Invalid foldCover: ${foldCover}`)
        }

        hinges.forEach((hinge, i) => {
            if (!isOnGrid(hinge)) {
                throw new Error(
                    `Produced invalid hinge coordinates, hinge=${i}: (${hinge.x}, ${hinge.y})` +
                        ` for start=(${start.x}, ${start.y}), end=(${end.x}, ${end.y}), ` +
                        `foldCover=${foldCover}`
                )
            }
        })

        return new FoldSpec(start, hinges, end)
    }

    /**
     * "Compiles" the fold definition into two triangles.
     */
    toTriangles() {
        let nearTriangle = new paper.Path({ insert: false })
        nearTriangle.add(this.start)
        nearTriangle.add(this.hinges[0])
        nearTriangle.add(this.hinges[1])
        nearTriangle.closed = true
        nearTriangle.reorient(false, true)
        let farTriangle = new paper.Path({ insert: false })
        farTriangle.add(this.end)
        farTriangle.add(this.hinges[1])
        farTriangle.add(this.hinges[0])
        farTriangle.closed = true
        farTriangle.reorient(false, true)
        return {
            near: nearTriangle,
            far: farTriangle
        }
    }

    toQuad() {
        let quad = new paper.Path({ insert: false })
        quad.add(this.start)
        quad.add(this.hinges[0])
        quad.add(this.end)
        quad.add(this.hinges[1])
        quad.reorient(false, true)
        quad.closed = true
        return quad
    }

    static readonly triangleApexIndex = 0
}
