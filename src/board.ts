import paper from "paper"
import type { UnfoldPlan } from "./interact"
import { BKFG, CardinalDirs, Lattice, snapPointToGridBasis, type CellState } from "./mathy/lattice"

type Patch = {
    offset: paper.Point
    lattice: Lattice
}

function forgivingFloor(point: paper.Point): paper.Point {
    const epsilon = 0.01
    return new paper.Point(
        Math.abs(point.x - Math.round(point.x)) < epsilon ? Math.round(point.x) : Math.floor(point.x),
        Math.abs(point.y - Math.round(point.y)) < epsilon ? Math.round(point.y) : Math.floor(point.y)
    )
}

function forgivingCeil(point: paper.Point): paper.Point {
    const epsilon = 0.01
    return new paper.Point(
        Math.abs(point.x - Math.round(point.x)) < epsilon ? Math.round(point.x) : Math.ceil(point.x),
        Math.abs(point.y - Math.round(point.y)) < epsilon ? Math.round(point.y) : Math.ceil(point.y)
    )
}

export class Board {
    readonly gridIncrement = 25
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
        this.lattice = new Lattice(width, height, BKFG.Background)
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
            gridPoint.x >= 0 && gridPoint.x <= this.width
            && gridPoint.y >= 0 && gridPoint.y <= this.height)
    }

    getBgNodes(): paper.Point[] {
        const bgNodes: paper.Point[] = []
        for (let x = 0; x <= this.width; x++) {
            for (let y = 0; y <= this.height; y++) {
                if (this.lattice.vertexIsClear(new paper.Point(x, y))) {
                    bgNodes.push(new paper.Point(x, y))
                }
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
            if (!this.lattice.lineIsAvailable(apex, hinges[0])
                || !this.lattice.lineIsAvailable(apex, hinges[1])
                || !this.lattice.lineIsAvailable(hinges[0], hinges[1])
                || !this.lattice.lineIsAvailable(hinges[0], end)
                || !this.lattice.lineIsAvailable(hinges[1], end)) {
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

    static rasterize(polygon: paper.Path): Patch {
        let originalBoundingBox = polygon.bounds
        let topLeft = forgivingFloor(originalBoundingBox.topLeft)
        let bottomRight = forgivingCeil(originalBoundingBox.bottomRight)
        // We assume the polygon is already aligned to the grid,
        // but still do a sanity check
        if ([topLeft.x, topLeft.y, bottomRight.x, bottomRight.y].some(
            p => p % 1 > 0.1)) {
            throw new Error("Polygon is not aligned to the grid")
        }
        let translatedPolygon = polygon.clone()
        translatedPolygon.translate(topLeft.multiply(-1))
        let patchSize = bottomRight.add(topLeft.multiply(-1))
        return {
            offset: topLeft,
            lattice: Lattice.rasterizePatch(patchSize, translatedPolygon)
        }
    }

    applyPatch(patch: Patch, cellState: CellState) {
        for (let x = 0; x < patch.lattice.width; x++) {
            for (let y = 0; y < patch.lattice.height; y++) {
                for (let dir of CardinalDirs) {
                    if (patch.lattice.cells[x][y].states.get(dir) == BKFG.Shape) {
                        let targetCell = this.lattice.cells[x + patch.offset.x][y + patch.offset.y]
                        targetCell.states.set(dir, cellState)
                    }
                }
            }
        }                
    }

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
}
