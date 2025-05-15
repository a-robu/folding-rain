import paper from "paper"
import { Board } from "../board"
import { isCellCoordinate, isHalfIntegerVertex, snapPointToGridBasis } from "./integers"

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

/**
 * This cardinal direction is used to index the triangles in the cell. The order
 * is meaningful (the permutations are defined based on this order).
 */

export const DIR = {
    N: "N",
    E: "E",
    S: "S",
    W: "W"
} as const
type CardinalDir = keyof typeof DIR
export const CardinalDirs: CardinalDir[] = [DIR.N, DIR.E, DIR.S, DIR.W]

/**
 * Floating point number equality check with absolute tolerance.
 * @param x
 * @param target
 * @param absTol - defaults to 0.1, appropriate to discriminate between lattice vertices
 * @returns
 */
export function isCloseTo(x: number, target: number, absTol: number = 0.1) {
    return Math.abs(x - target) < absTol
}

// /**
//  * This defines all valid reflection axes of the lattice. The keys are the
//  * axes and the values are the permutations of the cardinal directions
//  * that result from flipping the lattice around that axis.
//  *
//  * These permutations are used by the `flipped` method of the Cell class to
//  * apply the reflection operation.
//  */
// const FlipPermutations = new Map<string, number[]>([
//     // Flip around horizontal axis (-)
//     // +-------+        +-------+
//     // | \ N / |        | \ S / |
//     // | W x E | => | W x E | (N and S are swapped)
//     // | / S \ |        | / N \ |
//     // +-------+        +-------+
//     ["-", [DIR.S, DIR.E, DIR.N, DIR.W],
//     // Flip around vertical axis (|)
//     // +-------+        +-------+
//     // | \ N / |        | \ N / |
//     // | W x E | => | E x W | (E and W are swapped)
//     // | / S \ |        | / S \ |
//     // +-------+        +-------+
//     ["|", [DIR.N, DIR.W, DIR.S, DIR.E],
//     // Flip around main diagonal (\)
//     // +-------+        +-------+
//     // | \ N / |        | \ W / |
//     // | W x E | => | N x S | (N & W and S & E are swapped)
//     // | / S \ |        | / E \ |
//     // +-------+        +-------+
//     ["\\", [DIR.W, DIR.S, DIR.E, DIR.N],
//     // Flip around anti-diagonal (/)
//     // +-------+        +-------+
//     // | \ N / |        | \ E / |
//     // | W x E | => | S x N | (N & E and S & W are swapped)
//     // | / S \ |        | / W \ |
//     // +-------+        +-------+
//     ["/", [DIR.E, DIR.N, DIR.W, DIR.S],
// ])

type TriangleIndex = {
    cell: paper.Point
    cardinalDirection: CardinalDir
}

// export const DIR = {
//     N: "N",
//     E: "E",
//     S: "S",
//     W: "W"
// } as const;
// type CardinalDir = keyof typeof DIR
// const CardinalDirs: CardinalDir[] = [DIR.N, DIR.E, DIR.S, DIR.W]

export const BKFG = {
    Shape: "Shape",
    Background: "Background"
} as const
type BackgroundOrShape = keyof typeof BKFG
export type CellState = number | null | BackgroundOrShape

/**
 * Represents a single cell in the lattice.
 */
export class Cell {
    states: Map<CardinalDir, CellState> = new Map()

    constructor(initialState: CellState = null) {
        for (const dir of CardinalDirs) {
            this.states.set(dir, initialState)
        }
    }

    // get N() { return this.get(DIR.N) }
    // get E() { return this.get(DIR.E) }
    // get S() { return this.get(DIR.S) }
    // get W() { return this.get(DIR.W) }

    // set N(value: CellState) { this.set(DIR.N, value) }
    // set E(value: CellState) { this.set(DIR.E, value) }
    // set S(value: CellState) { this.set(DIR.S, value) }
    // set W(value: CellState) { this.set(DIR.W, value) }

    static makePolygon(dir: CardinalDir) {
        const polygon = new paper.Path([
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(0.5, 0.5)
        ])
        polygon.closed = true
        polygon.rotate(
            {
                [DIR.N]: 0,
                [DIR.E]: 90,
                [DIR.S]: 180,
                [DIR.W]: 270
            }[dir],
            new paper.Point(0.5, 0.5)
        )
        return polygon
    }

    // static get Vertices() {
    //     return [
    //         new paper.Point(0, 0), // top-left corner
    //         new paper.Point(1, 0), // top-right corner
    //         new paper.Point(1, 1), // bottom-right corner
    //         new paper.Point(0, 1),    // bottom-left corner
    //         new paper.Point(0.5, 0.5), // center of the square
    //     ]
    // }

    // /**
    //  * Returns a wedge that faces in the given direction.
    //  */
    // static cardinalDirectionWedge(direction: CardinalDir) {
    //     // Define the wedge (but for now centered on the origin)
    //     let wedge = [new paper.Point(0.5, -0.5), new paper.Point(0.5, 0.5)]
    //     // Rotate the wedge to the right direction
    //     let rotation = {
    //         [DIR.E]: 0,
    //         [DIR.N]: 90,
    //         [DIR.W]: 180,
    //         [DIR.S]: 270
    //     }[direction]
    //     // Rotate the wedge to face the correct triangle
    //     return wedge.map(p => p.rotate(rotation, new paper.Point(0, 0)))
    // }

    // setMany(directions: CardinalDir[], value: CellState) {
    //     for (const direction of directions) {
    //         this.states.set(direction, value)
    //     }
    // }

    // getAll() {
    //     const result: CardinalDir[] = []
    //     for (const [index, value] of this.triangleStates.entries()) {
    //         if (value) {
    //             result.push(CardinalDirs[index])
    //         }
    //     }
    //     return result;
    // }

    // /**
    //  * Flips the cell around the given axis.
    //  * @param axis - Valid values are the keys of the FlipPermutations map.
    //  * @returns A new Cell object with the triangles flipped around the given axis.
    //  */
    // flipped(axis: string) {
    //     const permutation = FlipPermutations.get(axis)
    //     if (permutation === undefined) {
    //         throw new Error(`Invalid axis: ${axis}`)
    //     }
    //     const newCell = new Cell()
    //     for (let i = 0; i < 4; i++) {
    //         // newCell.triangleStates[i] = this.triangleStates[permutation[i]];
    //     }
    //     return newCell;
    // }
}

type subgrid = "corners" | "midpoints"

function getVertexSubgrid(vertex: paper.Point): subgrid {
    if (isCellCoordinate(vertex)) {
        return "corners"
    } else if (isHalfIntegerVertex(vertex)) {
        return "midpoints"
    }
    throw new Error(
        `Vertex (${vertex.x}, ${vertex.y}) is not a valid vertex of the lattice. It must be either a cell coordinate or a half-integer coordinate.`
    )
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
        if (!isCellCoordinate(triangleIndex.cell)) {
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
            if (!(cell.x >= 0 && cell.x < this.width && cell.y >= 0 && cell.y < this.height)) {
                throw new Error(
                    `Failed to produce cell index within valid bounds (${cell.x}, ${cell.y})`
                )
            }
        }
        return snappedResults
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
     * Rasterize a polygon, creating a new lattice
     * @param size - The size of the lattice to create
     * @param polygon - The polygon to rasterize
     * @returns A new Lattice object
     */
    static rasterizePatch(size: paper.Point, polygon: paper.Path) {
        let lattice = new Lattice(size.x, size.y, null)
        for (let triangle of lattice.allTriangleIndices()) {
            const centroid = Lattice.centroid(triangle)
            if (polygon.contains(centroid)) {
                lattice.cells[triangle.cell.x][triangle.cell.y].states.set(
                    triangle.cardinalDirection,
                    BKFG.Shape
                )
            }
        }
        return lattice
    }

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
}
