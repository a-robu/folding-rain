import paper from "paper"

/**
 * Converts a number to its sign or 0 if it's close to zero (within 0.1).
 * @param value a number to snap
 * @returns -1, 0 or 1
 */
export function snapToTrit(value: number): number {
    if (value > 0.1) {
        return 1
    } else if (value < -0.1) {
        return -1
    }
    return 0
}

export function snapPointToGridBasis(point: paper.Point): paper.Point {
    return new paper.Point(snapToTrit(point.x), snapToTrit(point.y))
}

export function roundVertexToHalfIntegers(point: paper.Point): paper.Point {
    return point.multiply(2).round().multiply(0.5)
}

export function forgivingFloor(x: number): number {
    const epsilon = 0.01
    return Math.abs(x - Math.round(x)) < epsilon ? Math.round(x) : Math.floor(x)
}

export function forgivingCeil(x: number): number {
    const epsilon = 0.01
    return Math.abs(x - Math.round(x)) < epsilon ? Math.round(x) : Math.ceil(x)
}

export function pointForgivingFloor(point: paper.Point): paper.Point {
    const epsilon = 0.01
    return new paper.Point(
        Math.abs(point.x - Math.round(point.x)) < epsilon
            ? Math.round(point.x)
            : Math.floor(point.x),
        Math.abs(point.y - Math.round(point.y)) < epsilon
            ? Math.round(point.y)
            : Math.floor(point.y)
    )
}

// export function pointForgivingCeil(point: paper.Point): paper.Point {
//     const epsilon = 0.01
//     return new paper.Point(
//         Math.abs(point.x - Math.round(point.x)) < epsilon
//             ? Math.round(point.x)
//             : Math.ceil(point.x),
//         Math.abs(point.y - Math.round(point.y)) < epsilon ? Math.round(point.y) : Math.ceil(point.y)
//     )
// }

// export function isCellCoordinate(vertex: paper.Point) {
//     return Number.isInteger(vertex.x) && Number.isInteger(vertex.y)
// }

// export function isHalfIntegerVertex(vertex: paper.Point) {
//     return Number.isInteger(vertex.x * 2) && Number.isInteger(vertex.y * 2)
// }

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
