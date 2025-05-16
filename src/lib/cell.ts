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
export type CardinalDir = keyof typeof DIR
export const CardinalDirs: CardinalDir[] = [DIR.N, DIR.E, DIR.S, DIR.W]

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

export const CELL_STATE = {
    Shape: "Shape",
    Background: "Background",
    Frozen: "Frozen"
} as const
type BackgroundOrShape = keyof typeof CELL_STATE
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
