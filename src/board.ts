import paper from "paper"
import type { UnfoldPlan } from "./interact"

/**
 * Converts a number to its sign or 0 if it's close to zero (within 0.1).
 * @param value a number to snap
 * @returns -1, 0 or 1
 */
function snapToTrit(value: number): number {
    if (value > 0.1) {
        return 1
    } else if (value < -0.1) {
        return -1
    }
    return 0
}

function snapPointToGridBasis(point: paper.Point): paper.Point {
    return new paper.Point(snapToTrit(point.x), snapToTrit(point.y))
}

export class Board {
    readonly gridIncrement = 25
    readonly width: number
    readonly height: number

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
    }

    gridToPaperCoordinates(gridPoint: paper.Point): paper.Point {
        return new paper.Point(gridPoint.x * this.gridIncrement, gridPoint.y * this.gridIncrement)
    }

    paperToGridCoordinates(paperPoint: paper.Point): paper.Point {
        return new paper.Point(
            Math.floor((paperPoint.x + 0.5 * this.gridIncrement) / this.gridIncrement),
            Math.floor((paperPoint.y + 0.5 * this.gridIncrement) / this.gridIncrement)
        )
    }

    isInBounds(gridPoint: paper.Point): boolean {
        return (
            gridPoint.x >= 0 && gridPoint.x < this.width
            && gridPoint.y >= 0 && gridPoint.y < this.height)
    }

    getBgNodes(): paper.Point[] {
        const bgNodes: paper.Point[] = []
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                bgNodes.push(new paper.Point(x, y))
            }
        }
        return bgNodes
    }

    /**
     * Returns all 90 degree wedges from a given vertex. For vertices that are
     * on the border, wedges pointing outside the grid are excluded.
     * @param vertex a point in the grid from which to produce the wedges
     * @returns an array of edge-direction pairs which can be used to create triangles
     */
    all90DegWedges(vertex: paper.Point): [paper.Point, paper.Point][] {
        // Verify the input is valid (on the grid)
        if (!this.isInBounds(vertex)) {
            throw new Error("Vertex must be on the grid")
        }
        // The idea of this implementation is to start for a good 90-degree wedge
        // and then rotate it around the vertex, returning all the "good" wedges
        // this produces (wedges that are not pointing to the border).
        const right = new paper.Point(1, 0)
        const up = new paper.Point(0, -1)
        const wedges: [paper.Point, paper.Point][] = [];
        for (let i = 0; i < 8; i++) {
            const angle = i * 45
            const rotatedRight = snapPointToGridBasis(right.rotate(angle, new paper.Point(0, 0)))
            const rotatedUp = snapPointToGridBasis(up.rotate(angle, new paper.Point(0, 0)))
            if (this.isInBounds(vertex.add(rotatedRight))
                && this.isInBounds(vertex.add(rotatedUp))) {
                wedges.push([rotatedRight, rotatedUp])
            }
        } 
        return wedges;
    }

    allValidWedgeExpansions(apex: paper.Point, wedge: [paper.Point, paper.Point]): UnfoldPlan[] {
        const unfoldPlans: UnfoldPlan[] = []
        let expandBy = 1
        while (true) {
            // Create an expanded version of the wedge
            let expandedWedge = [wedge[0].multiply(expandBy), wedge[1].multiply(expandBy)]
            let hinges = [apex.add(expandedWedge[0]), apex.add(expandedWedge[1])]
            let end = apex.add(expandedWedge[0]).add(expandedWedge[1])
            // Check that it's i
            if (!this.isInBounds(end)
                || !this.isInBounds(hinges[0])
                || !this.isInBounds(hinges[1])) {
                break
            }
            unfoldPlans.push({
                start: apex,
                hinges: [hinges[0], hinges[1]],
                end: end
            })
            expandBy++
        }
        return unfoldPlans;
    }
}
