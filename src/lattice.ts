import paper from "paper";

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
const CardinalDirections = ["N", "E", "S", "W"];

/**
 * This is a utility lookup table to convert the cardinal directions back to
 * the indices they have in the array above.
 */
const CardinalDirectionIndices = new Map<string, number>(
    CardinalDirections.map((dir, index) => [dir, index]))

/**
 * Floating point number equality check with absolute tolerance.
 * @param x 
 * @param target 
 * @param absTol - defaults to 0.1, appropriate to discriminate between lattice vertices
 * @returns 
 */
export function isCloseTo(x: number, target: number, absTol: number = 0.1) {
    return Math.abs(x - target) < absTol;
}

/**
 * This defines all valid reflection axes of the lattice. The keys are the
 * axes and the values are the permutations of the cardinal directions
 * that result from flipping the lattice around that axis.
 * 
 * These permutations are used by the `flipped` method of the Cell class to
 * apply the reflection operation.
 */
const FlipPermutations = new Map<string, number[]>([
    // Flip around horizontal axis (-)
    // +-------+        +-------+
    // | \ N / |        | \ S / |
    // | W x E | => | W x E | (N and S are swapped)
    // | / S \ |        | / N \ |
    // +-------+        +-------+
    ["-", ["S", "E", "N", "W"].map(dir => CardinalDirectionIndices.get(dir)!)],
    // Flip around vertical axis (|)
    // +-------+        +-------+
    // | \ N / |        | \ N / |
    // | W x E | => | E x W | (E and W are swapped)
    // | / S \ |        | / S \ |
    // +-------+        +-------+
    ["|", ["N", "W", "S", "E"].map(dir => CardinalDirectionIndices.get(dir)!)],
    // Flip around main diagonal (\)
    // +-------+        +-------+
    // | \ N / |        | \ W / |
    // | W x E | => | N x S | (N & W and S & E are swapped)
    // | / S \ |        | / E \ |
    // +-------+        +-------+
    ["\\", ["W", "S", "E", "N"].map(dir => CardinalDirectionIndices.get(dir)!)],
    // Flip around anti-diagonal (/)
    // +-------+        +-------+
    // | \ N / |        | \ E / |
    // | W x E | => | S x N | (N & E and S & W are swapped)
    // | / S \ |        | / W \ |
    // +-------+        +-------+
    ["/", ["E", "N", "W", "S"].map(dir => CardinalDirectionIndices.get(dir)!)],
])

/**
 * Represents a single cell in the lattice.
 */
export class Cell {
    triangleStates = [false, false, false, false];

    get(direction: string): boolean {
        const index = CardinalDirectionIndices.get(direction)
        if (index === undefined) {
            throw new Error(`Invalid direction: ${direction}`)
        }
        return this.triangleStates[index];
    }

    get N() { return this.get("N") }
    get E() { return this.get("E") }
    get S() { return this.get("S") }
    get W() { return this.get("W") }

    set(direction: string, value: boolean) {
        const index = CardinalDirectionIndices.get(direction)
        if (index === undefined) {
            throw new Error(`Invalid direction: ${direction}`)
        }
        this.triangleStates[index] = value;
    }

    set N(value: boolean) { this.set("N", value) }
    set E(value: boolean) { this.set("E", value) }
    set S(value: boolean) { this.set("S", value) }
    set W(value: boolean) { this.set("W", value) }

    static get Vertices() {
        return [
            new paper.Point(0, 0), // top-left corner
            new paper.Point(1, 0), // top-right corner
            new paper.Point(1, 1), // bottom-right corner
            new paper.Point(0, 1),    // bottom-left corner
            new paper.Point(0.5, 0.5), // center of the square
        ]
    }

    static get TriangleVertexIndices() {
        return new Map<string, number[]>([
            ["N", [0, 1, 4]],
            ["E", [1, 2, 4]],
            ["S", [2, 3, 4]],
            ["W", [3, 0, 4]],
        ])
    }

    setMany(directions: string | string[] | Set<string>, value: boolean) {
        for (const direction of directions) {
            this.set(direction, value)
        }
    }

    getAll() {
        const result = new Set<string>()
        for (const [index, value] of this.triangleStates.entries()) {
            if (value) {
                result.add(CardinalDirections[index])
            }
        }
        return result;
    }

    /**
     * Flips the cell around the given axis.
     * @param axis - Valid values are the keys of the FlipPermutations map.
     * @returns A new Cell object with the triangles flipped around the given axis.
     */
    flipped(axis: string) {
        const permutation = FlipPermutations.get(axis)
        if (permutation === undefined) {
            throw new Error(`Invalid axis: ${axis}`)
        }
        const newCell = new Cell()
        for (let i = 0; i < 4; i++) {
            newCell.triangleStates[i] = this.triangleStates[permutation[i]];
        }
        return newCell;
    }
}

/**
 * Represents the entire lattice of cells (made of individual cells arranged in a
 * square grid).
 */
export class Lattice {
    width: number;
    height: number;
    cells: Cell[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = this.createEmptyGrid(width, height)
    }

    private createEmptyGrid(width: number, height: number): Cell[][] {
        const grid: Cell[][] = [];
        for (let y = 0; y < height; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < width; x++) {
                row.push(new Cell())
            }
            grid.push(row)
        }
        return grid;
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

        return vertices;
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
}
