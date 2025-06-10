import paper from "paper"
import { isOnTetrakisLattice, roundToHalfIntegerCoordinate } from "./tetrakis"

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

export const FOLD_TYPE = {
    Create: "Create",
    Remove: "Remove",
    Expand: "Expand",
    Contract: "Contract"
} as const

export type FoldType = keyof typeof FOLD_TYPE

export const FOLD_TEMPLATES: Record<FoldType, FoldTemplate> = {
    [FOLD_TYPE.Create]: {
        near: SHAPE_CHANGE.Add,
        far: SHAPE_CHANGE.Add
    },
    [FOLD_TYPE.Remove]: {
        near: SHAPE_CHANGE.Remove,
        far: SHAPE_CHANGE.Remove
    },
    [FOLD_TYPE.Expand]: {
        near: SHAPE_CHANGE.Keep,
        far: SHAPE_CHANGE.Add
    },
    [FOLD_TYPE.Contract]: {
        near: SHAPE_CHANGE.Add,
        far: SHAPE_CHANGE.Keep
    }
}

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
    static fromEndPoints(start: paper.Point, end: paper.Point): FoldSpec {
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
        let midpoint = start.add(vector.multiply(0.5))

        let hinges: [paper.Point, paper.Point] = [
            roundToHalfIntegerCoordinate(
                midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
            ),
            roundToHalfIntegerCoordinate(
                midpoint.add(vector.multiply(0.5).rotate(90, new paper.Point(0, 0)))
            )
        ]

        hinges.forEach((hinge, i) => {
            if (!isOnTetrakisLattice(hinge)) {
                throw new Error(
                    `Produced invalid hinge coordinates, hinge=${i}: (${hinge.x}, ${hinge.y})`
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
