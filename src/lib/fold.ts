import paper from "paper"
import { isOnTetrakisLattice, roundToHalfIntegers } from "./tetrakis"

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
        near: SHAPE_CHANGE.Add,
        far: SHAPE_CHANGE.Keep
    }
}

export const FOLD_COVER = {
    Full: "Full",
    Left: "Left",
    Right: "Right"
}
export type FoldCover = keyof typeof FOLD_COVER
export const FOLD_COVERS: FoldCover[] = Object.keys(FOLD_COVER) as FoldCover[]

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

    /**
     * Defines a fold of two right-isosceles triangles sitting back to back,
     * given their apex points. Assumes the inputs are valid, meaning
     * non-equal, lattice-aligned points. Throws an error if they are not.
     * Also throws an error if the produced hinges are not valid.
     * The first hinge will be in the clockwise direction from the start point,
     * and the second hinge will be in the counter-clockwise direction.
     */
    static fromEndPoints(
        start: paper.Point,
        end: paper.Point,
        foldCover = FOLD_COVER.Full
    ): FoldSpec {
        // Check that the input points are valid vertex coordinates
        for (let [point, name] of [
            [start, "start"],
            [end, "end"]
        ] as [paper.Point, string][]) {
            if (!isOnTetrakisLattice(point)) {
                throw new Error(`Invalid ${name} coordinates: (${point.x}, ${point.y})`)
            }
        }

        // Check that the start and end are not the same points
        if (start.equals(end)) {
            throw new Error(`Start and end points are the same: (${start.x}, ${start.y})`)
        }

        // We assume the input defines a valid (lattice-aligned) square.
        // So we just add the other two corners.
        let vector = end.subtract(start)
        let midpoint = roundToHalfIntegers(start.add(vector.multiply(0.5)))
        let leftCorner = roundToHalfIntegers(
            midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
        )
        let rightCorner = roundToHalfIntegers(
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
            if (!isOnTetrakisLattice(hinge)) {
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
        let nearTriangle = new paper.Path()
        nearTriangle.add(this.start)
        nearTriangle.add(this.hinges[0])
        nearTriangle.add(this.hinges[1])
        nearTriangle.closed = true
        let farTriangle = new paper.Path()
        farTriangle.add(this.end)
        farTriangle.add(this.hinges[1])
        farTriangle.add(this.hinges[0])
        farTriangle.closed = true
        return {
            near: nearTriangle,
            far: farTriangle
        }
    }

    toQuad() {
        let quad = new paper.Path()
        quad.add(this.start)
        quad.add(this.hinges[0])
        quad.add(this.end)
        quad.add(this.hinges[1])
        quad.closed = true
        return quad
    }

    static readonly triangleApexIndex = 0
}
