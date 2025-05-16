import paper from "paper"
import { BGFG, type CellState } from "./lib/cell"
import { Lattice } from "./lib/lattice"
import {
    forgivingCeil,
    pointForgivingCeil,
    pointForgivingFloor,
    roundVertexToHalfIntegers
} from "./lib/integers"
import {
    createFold,
    makePathFromUnfoldPlan,
    reverseUnfoldPlan,
    transposeFoldPlan,
    unfoldPlanToTrangles,
    type FoldCoordinates
} from "./lib/fold"

// type Patch = {
//     offset: paper.Point
//     lattice: Lattice
// }

export class Board {
    readonly width: number
    readonly height: number
    nextShapeId = 0
    lattice: Lattice
    shapes: Map<number, paper.Path> = new Map()

    /**
     * @param width - The width of the board in grid units (not the number of cells!)
     * @param height - The height of the board in grid units (not the number of cells!)
     */
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.lattice = new Lattice(width, height, BGFG.Background)
    }

    static snapToNearestVertex(point: paper.Point): paper.Point {
        // Uhm so when you take the voronoi diagram of all valid
        // vertices, you actually discover that it's a 45-degree
        // rotated square grid. So we can just enter that space
        // and round the point there.
        let inRotatedSpace = point
            .rotate(-45, new paper.Point(0, 0))
            // Actually, we also need to scale the space, to make it so
            // the distance from the corner of a square to the center is 1.
            .multiply(Math.sqrt(2))
        let snapped = inRotatedSpace.round()
        let inOurSpace = snapped.rotate(45, new paper.Point(0, 0)).multiply(1 / Math.sqrt(2))
        // So we managed to appropriately snap the point to the valid vertices,
        // while respecting that voronoi diagram that separates the vertices
        // with diagonal lines. That's nice, but now, we're returning numbers
        // like -0.999999999998 and that causes equality checks against integers
        // to fail.
        return roundVertexToHalfIntegers(inOurSpace)
    }

    /**
     * Returns the rays that can be used to generate valid squares (aligned to the lattice).
     * The ray sizes indicate the valid step size to take in the direction of the ray.
     * @param vertex - The vertex from which to generate the rays
     */
    static validSquareRays(vertex: paper.Point): paper.Point[] {
        let templateRays: paper.Point[] = []
        if (vertex.x % 1 == 0 && vertex.y % 1 == 0) {
            // Case where the vertices are along the (0, 0) subgrid
            templateRays.push(new paper.Point(2, 0))
            templateRays.push(new paper.Point(1, 1))
        } else if (vertex.x % 0.5 == 0 && vertex.y % 0.5 == 0) {
            // Case where the vertices are along the (.5, .5) subgrid
            templateRays.push(new paper.Point(1, 0))
        } else {
            // Catch invalid vertices
            throw new Error(`Invalid vertex provided (${vertex.x}, ${vertex.y})`)
        }
        let rotatedRays: paper.Point[] = []
        // For both cases, the problem is symmetric along 90-degree rotation.
        // So we can produce the remaining rays by rotating the template rays.
        for (let angle of [0, 90, 180, 270]) {
            for (let ray of templateRays) {
                rotatedRays.push(ray.rotate(angle, new paper.Point(0, 0)))
            }
        }
        return rotatedRays
    }

    // vertexIsInBounds(gridPoint: paper.Point): boolean {
    //     return (
    //         gridPoint.x >= -0.01 &&
    //         gridPoint.x <= this.width + 0.01 &&
    //         gridPoint.y >= -0.01 &&
    //         gridPoint.y <= this.height + 0.01
    //     )
    }

    // getBgNodes(): paper.Point[] {
    //     const bgNodes: paper.Point[] = []
    //     for (let x = 0; x <= this.width; x++) {
    //         for (let y = 0; y <= this.height; y++) {
    //             if (this.lattice.vertexIsClear(new paper.Point(x, y))) {
    //                 bgNodes.push(new paper.Point(x, y))
    //             }
    //         }
    //     }
    //     return bgNodes
    // }

    // /**
    //  * Returns all 90 degree wedges from a given vertex. For vertices that are
    //  * on the border, wedges pointing outside the grid are excluded.
    //  * @param vertex a point in the grid from which to produce the wedges
    //  * @returns an array of edge-direction pairs which can be used to create triangles
    //  */
    // all90DegWedges(vertex: paper.Point): [paper.Point, paper.Point][] {
    //     // Verify the input is valid (on the grid)
    //     if (!this.isInBounds(vertex)) {
    //         throw new Error("Vertex must be on the grid")
    //     }
    //     // The idea of this implementation is to start for a good 90-degree wedge
    //     // and then rotate it around the vertex, returning all the "good" wedges
    //     // this produces (wedges that are not pointing to the border).
    //     const right = new paper.Point(1, 0)
    //     const up = new paper.Point(0, -1)
    //     const wedges: [paper.Point, paper.Point][] = []
    //     for (let i = 0; i < 8; i++) {
    //         const angle = i * 45
    //         const rotatedRight = snapPointToGridBasis(right.rotate(angle, new paper.Point(0, 0)))
    //         const rotatedUp = snapPointToGridBasis(up.rotate(angle, new paper.Point(0, 0)))
    //         if (
    //             this.isInBounds(vertex.add(rotatedRight)) &&
    //             this.isInBounds(vertex.add(rotatedUp))
    //         ) {
    //             wedges.push([rotatedRight, rotatedUp])
    //         }
    //     }
    //     return wedges
    // }

    // allValidWedgeExpansions(apex: paper.Point, wedge: [paper.Point, paper.Point]): UnfoldPlan[] {
    //     const unfoldPlans: UnfoldPlan[] = []
    //     let expandBy = 1
    //     while (true) {
    //         // Create an expanded version of the wedge
    //         let expandedWedge = [wedge[0].multiply(expandBy), wedge[1].multiply(expandBy)]
    //         let hinges = [apex.add(expandedWedge[0]), apex.add(expandedWedge[1])]
    //         let end = apex.add(expandedWedge[0]).add(expandedWedge[1])
    //         // Check that it's i
    //         if (
    //             !this.isInBounds(end) ||
    //             !this.isInBounds(hinges[0]) ||
    //             !this.isInBounds(hinges[1])
    //         ) {
    //             break
    //         }
    //         if (
    //             !this.lattice.lineIsAvailable(apex, hinges[0]) ||
    //             !this.lattice.lineIsAvailable(apex, hinges[1]) ||
    //             !this.lattice.lineIsAvailable(hinges[0], hinges[1]) ||
    //             !this.lattice.lineIsAvailable(hinges[0], end) ||
    //             !this.lattice.lineIsAvailable(hinges[1], end)
    //         ) {
    //             break
    //         }
    //         unfoldPlans.push({
    //             start: apex,
    //             hinges: [hinges[0], hinges[1]],
    //             end: end
    //         })
    //         expandBy++
    //     }
    //     return unfoldPlans
    // }

    // static rasterize(polygon: paper.Path): Patch {
    //     let originalBoundingBox = polygon.bounds
    //     let topLeft = pointForgivingFloor(originalBoundingBox.topLeft)
    //     let bottomRight = pointForgivingCeil(originalBoundingBox.bottomRight)
    //     // We assume the polygon is already aligned to the grid,
    //     // but still do a sanity check
    //     if ([topLeft.x, topLeft.y, bottomRight.x, bottomRight.y].some(p => p % 1 > 0.1)) {
    //         throw new Error("Polygon is not aligned to the grid")
    //     }
    //     let translatedPolygon = polygon.clone()
    //     translatedPolygon.translate(topLeft.multiply(-1))
    //     let patchSize = bottomRight.add(topLeft.multiply(-1))
    //     return {
    //         offset: topLeft,
    //         lattice: Lattice.rasterizePatch(patchSize, translatedPolygon)
    //     }
    // }

    // applyPatch(patch: Patch, cellState: CellState) {
    //     for (let triangleIndex of patch.lattice.allTriangleIndices()) {
    //         let state = patch.lattice.getState(triangleIndex)
    //         if (state == BKFG.Shape) {
    //             this.lattice.setState(
    //                 {
    //                     cell: triangleIndex.cell.add(patch.offset),
    //                     cardinalDirection: triangleIndex.cardinalDirection
    //                 },
    //                 cellState
    //             )
    //         }
    //     }
    // }

    pathInBounds(polygon: paper.Path): boolean {
        return polygon.segments.every(segment => this.vertexIsInBounds(segment.point))
    }

    pathClear(polygon: paper.Path): boolean {
        let patch = Board.rasterize(polygon)
        let detectedStates = this.scanStatesUnderPatch(patch)
        // Check if the patch is clear
        for (let state of detectedStates) {
            if (state != BGFG.Background) {
                return false
            }
        }
        return true
    }

    static walkAlongLine(start: paper.Point, end: paper.Point): paper.Point[] {
        let points: paper.Point[] = []
        let diff = end.subtract(start)
        let stepSize = Math.abs(diff.x) < 0.1 || Math.abs(diff.y) < 0.1 ? 1 : Math.sqrt(2) / 2
        let stepVector = diff.normalize().multiply(stepSize)
        let steps = forgivingCeil(diff.length / stepSize)
        for (let n = 0; n <= steps; n++) {
            let point = roundVertexToHalfIntegers(start.add(stepVector.multiply(n)))
            points.push(point)
        }
        return points
    }

    static walkAlongPath(polygon: paper.Path): paper.Point[] {
        let points: paper.Point[] = []
        let previousPoint = polygon.segments[polygon.segments.length - 1].point
        for (let segment of polygon.segments) {
            let pointsAlongLine = Board.walkAlongLine(previousPoint, segment.point)
            points.push(...pointsAlongLine.slice(0, pointsAlongLine.length - 1))
            previousPoint = segment.point
        }
        return points
    }

    perimeterIsClear(polygon: paper.Path): boolean {
        let points = Board.walkAlongPath(polygon)
        for (let point of points) {
            for (let state of this.lattice.scanStatesAroundVertex(point)) {
                if (typeof state === "number") {
                    return false
                }
            }
        }
        return true
    }

    // scanStatesUnderPatch(patch: Patch): Set<CellState> {
    //     let detections = new Set<CellState>()
    //     for (let triangleIndex of patch.lattice.allTriangleIndices()) {
    //         let state = patch.lattice.getState(triangleIndex)
    //         if (state == BKFG.Shape) {
    //             let readState = this.lattice.getState({
    //                 cell: triangleIndex.cell.add(patch.offset),
    //                 cardinalDirection: triangleIndex.cardinalDirection
    //             })
    //             detections.add(readState)
    //         }
    //     }
    //     return detections
    // }

    /**
     * Creates a new shape on the board and returns its ID.
     * @param polygon the polygon to be added to the board
     * @returns the ID of the new shape
     */
    newShape(polygon: paper.Path): number {
        const id = this.nextShapeId
        this.nextShapeId++
        let copy = polygon.clone()
        this.shapes.set(id, copy)
        let patch = Board.rasterize(copy)
        this.applyPatch(patch, id)
        return id
    }

    allShapesIds(): number[] {
        return Array.from(this.shapes.keys())
    }

    getShapeEdges(id: number): [paper.Point, paper.Point][] {
        let shape = this.shapes.get(id)
        if (!shape) {
            throw new Error(`Shape with ID ${id} not found`)
        }
        let edges: [paper.Point, paper.Point][] = []
        for (let segment of shape.segments) {
            let start = segment.point
            let end = segment.next.point
            edges.push([start, end])
        }
        return edges
    }

    // allShapeSides(): [paper.Point, paper.Point][] {
    //     let sides: [paper.Point, paper.Point][] = []
    //     for (let shape of this.shapes.values()) {
    //         for (let segment of shape.segments) {
    //             let start = segment.point
    //             let end = segment.next.point
    //             sides.push([start, end])
    //         }
    //     }
    //     return sides
    // }

    detectSideUnfold(hinges: [paper.Point, paper.Point]): {
        unfoldPlan: FoldCoordinates
        shapeId: number
    } | null {
        let unfoldAttempt = transposeFoldPlan(createFold(hinges[0], hinges[1]))
        let [side1, side2] = unfoldPlanToTrangles(unfoldAttempt)
        let newPolygon = makePathFromUnfoldPlan(unfoldAttempt)
        if (!this.pathInBounds(newPolygon)) {
            return null
        }

        let statesUnderSide1 = this.scanStatesUnderPatch(Board.rasterize(side1))
        let statesUnderSide2 = this.scanStatesUnderPatch(Board.rasterize(side2))
        if (statesUnderSide1.size == 1 && statesUnderSide2.size == 1) {
            let under1 = statesUnderSide1.values().next().value
            let under2 = statesUnderSide2.values().next().value
            if (typeof under1 == "number" && under2 == BGFG.Background) {
                return { unfoldPlan: unfoldAttempt, shapeId: under1 }
            } else if (typeof under2 == "number" && under1 == BGFG.Background) {
                return { unfoldPlan: reverseUnfoldPlan(unfoldAttempt), shapeId: under2 }
            }
        }
        return null
    }
}
