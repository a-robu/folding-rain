import paper from "paper"
import { isCloseTo, snapPointToGridBasis } from "./integers"
import { BGFG, CardinalDirs, Cell, DIR, type CardinalDir, type CellState } from "./cell"

/**
 * Defines a Tetrakis square tiling and means of manipulating it.
 *
 * This is a 2D lattice of isosceles right triangles arranged in a square grid.
 * It looks like this:
 *
 *    +---+---+---+---+---+---+
 *    |\ /|\ /|\ /|\ /|\ /|\ /|
 *    | x | x | x | x | x | x |
 *    |/ \|/ \|/ \|/ \|/ \|/ \|
 *    +---+---+---+---+---+---+
 *    |\ /|\ /|\ /|\ /|\ /|\ /|
 *    | x | x | x | x | x | x |
 *    |/ \|/ \|/ \|/ \|/ \|/ \|
 *    +---+---+---+---+---+---+
 *
 * In this codebase we index the triangles in the lattice using three coorinates:
 * two numbers (x, y) for the cell and one letter (N, E, S, W) for the triangle.
 */

type subgrid = "corners" | "midpoints"

function getVertexSubgrid(vertex: paper.Point): subgrid {
    if (Lattice.isIntegerCoordinate(vertex)) {
        return "corners"
    } else if (Lattice.isVertexCoordinate(vertex)) {
        return "midpoints"
    }
    throw new Error(
        `Vertex (${vertex.x}, ${vertex.y}) is not a valid vertex of the lattice. It must be either a cell coordinate or a half-integer coordinate.`
    )
}

type TriangleIndex = {
    cell: paper.Point
    cardinalDirection: CardinalDir
}

/**
 * Error thrown when a vertex fails lattice validation.
 */
export class InvalidVertexError extends Error {
    vertex: paper.Point

    constructor(vertex: paper.Point, message: string) {
        super(`Invalid (${vertex.x}, ${vertex.y}): ${message}`)
        this.name = "InvalidVertexError"
        this.vertex = vertex
    }
}

type Patch = {
    offset: paper.Point
    lattice: Lattice
}

/**
 * Represents the entire lattice of cells (made of individual cells arranged in a
 * square grid).
 */
export class Lattice {
    private cells: Cell[][]

    constructor(width: number, height: number, initialState: CellState = null) {
        this.cells = this.createEmptyGrid(width, height, initialState)
    }

    get width() {
        return this.cells.length
    }

    get height() {
        return this.cells[0].length
    }

    private createEmptyGrid(width: number, height: number, initialState: CellState): Cell[][] {
        const cells: Cell[][] = []
        for (let x = 0; x < width; x++) {
            const column: Cell[] = []
            for (let y = 0; y < height; y++) {
                column.push(new Cell(initialState))
            }
            cells.push(column)
        }
        return cells
    }

    getState(triangleIndex: TriangleIndex): CellState {
        if (!this.cellIsInBounds(triangleIndex.cell)) {
            throw new Error(
                `Cell coordinates must be integers, given (${triangleIndex.cell.x}, ${triangleIndex.cell.y})`
            )
        }
        const cell = this.cells[triangleIndex.cell.x][triangleIndex.cell.y]
        return cell.states.get(triangleIndex.cardinalDirection)!
    }

    setState(triangleIndex: TriangleIndex, state: CellState) {
        const cell = this.cells[triangleIndex.cell.x][triangleIndex.cell.y]
        cell.states.set(triangleIndex.cardinalDirection, state)
    }

    makeTrianglePolygon(triangleIndex: TriangleIndex) {
        let polygon = Cell.makePolygon(triangleIndex.cardinalDirection)
        polygon.translate(new paper.Point(triangleIndex.cell.x, triangleIndex.cell.y))
        return polygon
    }

    vertexNeighbors(vertex: paper.Point): TriangleIndex[] {
        let neighbors: TriangleIndex[] = []
        if (getVertexSubgrid(vertex) === "midpoints") {
            // case of a vertex in the middle of the cell
            for (let dir of CardinalDirs) {
                neighbors.push({
                    // Here we are switching from indexing the vertex to the cell!
                    cell: new paper.Point(vertex.x - 0.5, vertex.y - 0.5),
                    cardinalDirection: dir
                })
            }
        } else {
            if (vertex.x > 0) {
                if (vertex.y > 0) {
                    // top-left corner is available
                    neighbors.push({
                        cell: new paper.Point(vertex.x - 1, vertex.y - 1),
                        cardinalDirection: DIR.S
                    })
                    neighbors.push({
                        cell: new paper.Point(vertex.x - 1, vertex.y - 1),
                        cardinalDirection: DIR.E
                    })
                }
                if (vertex.y < this.height) {
                    // bottom-left corner is available
                    neighbors.push({
                        cell: new paper.Point(vertex.x - 1, vertex.y),
                        cardinalDirection: DIR.N
                    })
                    neighbors.push({
                        cell: new paper.Point(vertex.x - 1, vertex.y),
                        cardinalDirection: DIR.E
                    })
                }
            }
            if (vertex.x < this.width) {
                if (vertex.y > 0) {
                    // top-right corner is available
                    neighbors.push({
                        cell: new paper.Point(vertex.x, vertex.y - 1),
                        cardinalDirection: DIR.S
                    })
                    neighbors.push({
                        cell: new paper.Point(vertex.x, vertex.y - 1),
                        cardinalDirection: DIR.W
                    })
                }
                if (vertex.y < this.height) {
                    // bottom-right corner is available
                    neighbors.push({
                        cell: new paper.Point(vertex.x, vertex.y),
                        cardinalDirection: DIR.N
                    })
                    neighbors.push({
                        cell: new paper.Point(vertex.x, vertex.y),
                        cardinalDirection: DIR.W
                    })
                }
            }
        }
        let snappedResults = neighbors.map(neighbor => ({
            cell: neighbor.cell.round(),
            cardinalDirection: neighbor.cardinalDirection
        }))
        for (let neighborIndex of snappedResults) {
            // throw an error if any of them out of bounds
            let cell = neighborIndex.cell
            if (!this.cellIsInBounds(cell)) {
                throw new Error(
                    `Failed to produce cell index within valid bounds (${cell.x}, ${cell.y})`
                )
            }
        }
        return snappedResults
    }

    cellIsInBounds(cell: paper.Point): boolean {
        if (!isCellCoordinate(cell)) {
            throw new Error(`Cell coordinates must be integers, given (${cell.x}, ${cell.y})`)
        }
        return cell.x >= 0 && cell.x < this.width && cell.y >= 0 && cell.y < this.height
    }

    scanStatesAroundVertex(vertex: paper.Point): CellState[] {
        let states = new Set<CellState>()
        for (let neighborIndex of this.vertexNeighbors(vertex)) {
            let state = this.getState(neighborIndex)
            states.add(state)
        }
        return Array.from(states)
    }

    vertexIsClear(vertex: paper.Point): boolean {
        let states = this.scanStatesAroundVertex(vertex)
        for (let state of states) {
            if (typeof state === "number") {
                return false
            }
        }
        return true
    }

    lineIsAvailable(start: paper.Point, end: paper.Point): boolean {
        let difference = end.subtract(start)
        let step = snapPointToGridBasis(difference)
        if (step.x != 0 && step.y != 0) {
            // diagonal line case
            step = step.multiply(0.5)
        }
        for (let i = 0; i < Math.round(difference.length / step.length); i++) {
            let current = start.add(step.multiply(i))
            if (!this.vertexIsClear(current)) {
                return false
            }
        }
        return true
    }

    /**
     * Provides all the vertices of the lattice (and therefore all the points that can be
     * used to draw the triangles).
     * @returns An array of all vertices in the lattice, provided at the corners of the
     * squares and each square center. The correspondence between the indices of the
     * grid cells and the coordinates of the vertices is such that the top left corner
     * of the grid cell (0, 0) corresponds to the vertex (0, 0).
     */
    allVertices() {
        let vertices: paper.Point[] = []

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // We'll avoid providing all the vertices in order to avoid creating duplicates.
                // We only provide the top-left corner of the square if this is top-left square
                // of the grid, meaning (x, y) == (0, 0).
                if (x == 0 && y == 0) {
                    vertices.push(new paper.Point(x, y))
                }
                // We only provide the top-right corner of the square if this square is in the
                // top row of the grid, meaning y == 0.
                if (y == 0) {
                    vertices.push(new paper.Point(x + 1, y))
                }
                // We only provide the bottom-left corner of the square if this square is in the
                // left column of the grid, meaning x == 0.
                if (x == 0) {
                    vertices.push(new paper.Point(x, y + 1))
                }
                // We always provide the bottom-right corner of the square.
                vertices.push(new paper.Point(x + 1, y + 1))
                // And we always provide the center of the square.
                vertices.push(new paper.Point(x + 0.5, y + 0.5))
            }
        }

        return vertices
    }

    isPerimeterVertex(vertex: paper.Point) {
        // Check if the vertex is on the perimeter of the lattice
        return (
            isCloseTo(vertex.x, 0) ||
            isCloseTo(vertex.x, this.width) ||
            isCloseTo(vertex.y, 0) ||
            isCloseTo(vertex.y, this.height)
        )
    }

    /**
     * Detects if a vertex is within the bounds of the lattice. This assumes
     * the input has valid half-integer coordinates. Behaviour is undefined otherwise.
     */
    vertexIsInBounds(vertex: paper.Point): boolean {
        return vertex.x >= 0 && vertex.x <= this.width && vertex.y >= 0 && vertex.y <= this.height
    }

    assertVertex(vertex: paper.Point, error: string) {
        if (!Lattice.isVertexCoordinate(vertex)) {
            throw new InvalidVertexError(
                vertex,
                (error.length > 0 ? error + " :" : "") +
                    "Coordinates must be half-integers on the Tetrakis lattice"
            )
        }
        if (!this.vertexIsInBounds(vertex)) {
            throw new InvalidVertexError(
                vertex,
                (error.length > 0 ? error + " :" : "") +
                    "Coordinates must be within the bounds of the lattice"
            )
        }
    }

    // /**
    //  * Creates a lattice the size of the given polygon
    //  * and rasterizes the polygon onto it.
    //  */
    // static patchFromPolygon(polygon: paper.Path) {
    //     for (let seg of polygon.segments) {
    //         if (!Lattice.isVertexCoordinate(seg.point)) {
    //             throw new Error(
    //                 `Polygon has invalid vertex (i=${seg.index}): (${seg.point.x}, ${seg.point.y})`
    //             )
    //         }
    //     }
    //     let bounds = polygon.bounds
    //     let topLeft = bounds.topLeft.floor()
    //     let bottomRight = bounds.bottomRight.ceil()
    //     let patchSize = bottomRight.subtract(topLeft)
    //     let patch = new Lattice(patchSize.x, patchSize.y)
    //     patch.rasterize(polygon, BKFG.Shape)
    //     return {
    //         offset: topLeft,
    //         lattice: patch
    //     }
    // }

    // /**
    //  * Paint a polygon onto this lattice.
    //  * @param polygon - The polygon to paint
    //  * @param state - The state to apply under the polygon
    //  */
    // rasterize(polygon: paper.Path, state: CellState) {
    //     // let lattice = new Lattice(size.x, size.y, null)
    //     for (let triangle of this.allTriangleIndices()) {
    //         const centroid = Lattice.centroid(triangle)
    //         if (polygon.contains(centroid)) {
    //             this.cells[triangle.cell.x][triangle.cell.y].states.set(
    //                 triangle.cardinalDirection,
    //                 state
    //             )
    //         }
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

    trianglesUnderPolygon(polygon: paper.Path): TriangleIndex[] {
        for (let seg of polygon.segments) {
            this.assertVertex(seg.point, `Polygon has invalid vertex (i=${seg.index})`)
        }
        let bounds = polygon.bounds
        let topLeft = bounds.topLeft.floor()
        let bottomRight = bounds.bottomRight.ceil()

        let triangles: TriangleIndex[] = []

        // Iterate over the cells in the bounding box of the polygon
        for (let x = topLeft.x; x < bottomRight.x; x++) {
            for (let y = topLeft.y; y < bottomRight.y; y++) {
                for (let dir of CardinalDirs) {
                    const triangleIndex = {
                        cell: new paper.Point(x, y),
                        cardinalDirection: dir
                    }
                    const centroid = Lattice.centroid(triangleIndex)
                    if (polygon.contains(centroid)) {
                        triangles.push(triangleIndex)
                    }
                }
            }
        }
        return triangles
    }

    getStatesUnderPolygon(polygon: paper.Path): Set<CellState> {
        let detections = new Set<CellState>()
        for (let triangleIndex of this.trianglesUnderPolygon(polygon)) {
            let state = this.getState(triangleIndex)
            detections.add(state)
        }
        return detections
    }

    setStatesUnderPolygon(polygon: paper.Path, state: CellState) {
        for (let triangleIndex of this.trianglesUnderPolygon(polygon)) {
            this.setState(triangleIndex, state)
        }
    }

    // rasterize(polygon: paper.Path, state: CellState) {
    //     // let lattice = new Lattice(size.x, size.y, null)
    //     for (let triangle of this.allTriangleIndices()) {
    //         const centroid = Lattice.centroid(triangle)
    //         if (polygon.contains(centroid)) {
    //             this.cells[triangle.cell.x][triangle.cell.y].states.set(
    //                 triangle.cardinalDirection,
    //                 state
    //             )
    //         }
    //     }
    // }

    // readStatesUnderPolygon(patch: Patch): Set<CellState> {

    //     // let detections = new Set<CellState>()
    //     // for (let triangleIndex of patch.lattice.allTriangleIndices()) {
    //     //     let state = patch.lattice.getState(triangleIndex)
    //     //     if (state == BKFG.Shape) {
    //     //         let readState = this.lattice.getState({
    //     //             cell: triangleIndex.cell.add(patch.offset),
    //     //             cardinalDirection: triangleIndex.cardinalDirection
    //     //         })
    //     //         detections.add(readState)
    //     //     }
    //     // }
    //     // return detections
    // }

    /**
     * @returns the indices of all triangles in the lattice.
     */
    allTriangleIndices() {
        let triangles: TriangleIndex[] = []
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = new paper.Point(x, y)
                for (const direction of CardinalDirs) {
                    triangles.push({
                        cell: cell,
                        cardinalDirection: direction
                    })
                }
            }
        }
        return triangles
    }

    /**
     * @returns the centroid of a triangle in the lattice.
     */
    static centroid(triangle: TriangleIndex) {
        // The centroid of any triangle is 2/3 of the way from the apex
        let distanceToCentroid = new paper.Point(0, (-2 / 3) * 0.5)
        // Now we rotate it to correspond to other side triangles.
        let rotation = {
            [DIR.N]: 0,
            [DIR.E]: 90,
            [DIR.S]: 180,
            [DIR.W]: 270
        }[triangle.cardinalDirection]
        let vectorToCentroid = distanceToCentroid.rotate(rotation, new paper.Point(0, 0))
        return triangle.cell.add(new paper.Point(0.5, 0.5)).add(vectorToCentroid)
    }

    /**
     * Check if the coordinates are integers. Can be used both to check if
     * the coordinates are valid cell indices or also if they lie along the
     * square-corners part of the Tetrakis lattice. Does not check bounds.
     */
    static isIntegerCoordinate(vertex: paper.Point) {
        return Number.isInteger(vertex.x) && Number.isInteger(vertex.y)
    }

    private static isHalfIntegerVertex(vertex: paper.Point) {
        return Number.isInteger(vertex.x * 2) && Number.isInteger(vertex.y * 2)
    }

    /**
     * Check if the coordinates are valid vertices on a Tetrakis square lattice.
     * Does not check bounds.
     */
    static isVertexCoordinate(vertex: paper.Point): boolean {
        // First check that they're not just any random numbers, but
        // that the coordinates are half-integers (i.e. 0.5, 1.5, etc.)
        if (!Lattice.isHalfIntegerVertex(vertex)) {
            return false
        }

        // To make this easier to reason about, we divide the problem
        // into two cases: either the vertex is on the corners of the
        // squares or in the middle of the squares.

        // First, the case where the vertex is on a square corner.
        if (Lattice.isIntegerCoordinate(vertex)) {
            // It lies along a corner, so it's valid.
            return true
        }

        // Square midpoints have +0.5 in both coordinates. We've already
        // checked that the coordinates are half-integers and that they
        // are not BOTH integers. So the only condition that can fail
        // this check is if one of the coordinates is an integer, which
        // would mean that the vertex is on the side of a square.

        // So now, veryify that the vertex is not on the side of a square.
        return !Number.isInteger(vertex.x) && !Number.isInteger(vertex.y)
    }
}
