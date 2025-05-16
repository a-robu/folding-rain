import paper from "paper"
import { roundVertexToHalfIntegers } from "./integers"
import { Lattice } from "./lattice"
import { CELL_STATE, type CellState } from "./cell"

export type CellTransition = {
    before: CellState
    after: CellState
}

export type FoldColoring = {
    near: CellTransition
    far: CellTransition
}

export const FOLD_COLORING = {
    Create: "Create",
    Remove: "Remove",
    Expand: "Expand",
    Contract: "Contract"
} as const

export type FoldColoringChoice = keyof typeof FOLD_COLORING

export const FOLD_COLORING_TEMPLATES: Record<FoldColoringChoice, FoldColoring> = {
    [FOLD_COLORING.Create]: {
        // We start with background and add shape on both sides
        near: {
            before: CELL_STATE.Background,
            after: CELL_STATE.Shape
        },
        far: {
            before: CELL_STATE.Background,
            after: CELL_STATE.Shape
        }
    },
    [FOLD_COLORING.Remove]: {
        // We start with shape and add background on both sides
        near: {
            before: CELL_STATE.Shape,
            after: CELL_STATE.Background
        },
        far: {
            before: CELL_STATE.Shape,
            after: CELL_STATE.Background
        }
    },
    [FOLD_COLORING.Expand]: {
        // We keep the near-side shape and add background on the far side
        near: {
            before: CELL_STATE.Shape,
            after: null
        },
        far: {
            before: CELL_STATE.Background,
            after: CELL_STATE.Shape
        }
    },
    [FOLD_COLORING.Contract]: {
        // We keep the far-side shape and add background on the near side
        near: {
            before: CELL_STATE.Shape,
            after: CELL_STATE.Background
        },
        far: {
            before: CELL_STATE.Shape,
            after: null
        }
    }
}

/**
 * Represents a shape with four vertices and an axis of symmetry
 * between two of them. The axis of symmetry forms a hinge around
 * which the start point moves to fold over to the end point.
 */
export class FoldCoordinates {
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
     */
    static fromEndPoints(start: paper.Point, end: paper.Point): FoldCoordinates {
        // Check that the input points are valid vertex coordinates
        for (let [point, name] of [
            [start, "start"],
            [end, "end"]
        ] as [paper.Point, string][]) {
            if (!Lattice.isVertexCoordinate(point)) {
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
            roundVertexToHalfIntegers(
                midpoint.add(vector.multiply(0.5).rotate(90, new paper.Point(0, 0)))
            ),
            roundVertexToHalfIntegers(
                midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
            )
        ]

        hinges.forEach((hinge, i) => {
            if (!Lattice.isVertexCoordinate(hinge)) {
                throw new Error(
                    `Produced invalid hinge coordinates, hinge=${i}: (${hinge.x}, ${hinge.y})`
                )
            }
        })

        return new FoldCoordinates(start, hinges, end)
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
        farTriangle.add(this.hinges[0])
        farTriangle.add(this.hinges[1])
        farTriangle.closed = true
        return {
            near: nearTriangle,
            far: farTriangle
        }
    }

    static readonly triangleApexIndex = 0
}

// export function transposeFoldPlan(plan: FoldCoordinates): FoldCoordinates {
//     return {
//         start: plan.hinges[0],
//         hinges: [plan.start, plan.end],
//         end: plan.hinges[1]
//     }
// }

// export function reverseUnfoldPlan(plan: FoldCoordinates): FoldCoordinates {
//     return {
//         start: plan.end,
//         hinges: plan.hinges,
//         end: plan.start
//     }
// }

// export function makePathFromUnfoldPlan(plan: FoldCoordinates): paper.Path {
//     let newPolygon = new paper.Path()
//     newPolygon.add(plan.start)
//     newPolygon.add(plan.hinges[0])
//     newPolygon.add(plan.end)
//     newPolygon.add(plan.hinges[1])
//     newPolygon.closed = true
//     return newPolygon
// }
