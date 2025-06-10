import paper from "paper"

export const SIDE = {
    N: "N",
    E: "E",
    S: "S",
    W: "W"
} as const
export type CardinalSide = keyof typeof SIDE
export const CardinalSides: CardinalSide[] = [SIDE.N, SIDE.E, SIDE.S, SIDE.W]

export type TriangleIdx = {
    squareIdx: paper.Point
    cardinalSide: CardinalSide
}

export function triangleIdxToKey(triangleIdx: TriangleIdx) {
    return `${triangleIdx.squareIdx.x},${triangleIdx.squareIdx.y},${triangleIdx.cardinalSide}`
}

export function triangleIdxFromKey(key: string): TriangleIdx {
    const parts = key.split(",")
    if (parts.length !== 3) {
        throw new Error(`Invalid triangle index key: ${key}`)
    }
    const squareIdx = new paper.Point(parseFloat(parts[0]), parseFloat(parts[1]))
    const cardinalSide = parts[2] as CardinalSide
    if (!CardinalSides.includes(cardinalSide)) {
        throw new Error(`Invalid cardinal side: ${cardinalSide}`)
    }
    return { squareIdx, cardinalSide }
}

/**
 * Check if the coordinates are integers. Can be used both to check if
 * the coordinates are valid cell indices or also if they lie along the
 * square-corners part of the Tetrakis lattice. Does not check bounds.
 */
export function isIntegerCoordinate(point: paper.Point) {
    return Number.isInteger(point.x) && Number.isInteger(point.y)
}

/**
 * Check if the coordinates are half-integers (i.e. 0.5, 1, 1.5, etc.).
 * Note: this includes coordinates which do not lie on the Tetrakis lattice!
 * @returns true if the coordinates were intergers which were divided by 2.
 */
export function isHalfIntegerCoordinate(point: paper.Point) {
    return Number.isInteger(point.x * 2) && Number.isInteger(point.y * 2)
}

/**
 * Check if the coordinates are valid vertices on a Tetrakis square lattice.
 * Note: does not check if the point lies within certain bounds.
 */
export function isOnTetrakisLattice(point: paper.Point): boolean {
    // First check that they're not just any random numbers, but
    // that the coordinates are half-integers (i.e. 0.5, 1.5, etc.)
    if (!isHalfIntegerCoordinate(point)) {
        return false
    }

    // To make this easier to reason about, we divide the problem
    // into two cases: either the point is on the corners of the
    // squares or in the middle of the squares.

    // First, the case where the point is on a square corner.
    if (isIntegerCoordinate(point)) {
        // It lies along a corner, so it's valid.
        return true
    }

    // Now, we make check that both coordinates are not integers.
    // This takes care of the case where the point is on the edge
    // of a square.
    return !Number.isInteger(point.x) && !Number.isInteger(point.y)
}

export function roundToHalfIntegerCoordinate(point: paper.Point): paper.Point {
    let result = point.multiply(2).round().divide(2)
    // Fix weird -0.0 values using Object.is
    if (Object.is(result.x, -0)) {
        result.x = 0
    }
    if (Object.is(result.y, -0)) {
        result.y = 0
    }
    return result
}

/**
 * Provides all the valid vertices of the Tetrakis square tiling in the specified area.
 */
export function allVertices(rect: paper.Rectangle): paper.Point[] {
    let vertices: paper.Point[] = []

    for (let y = rect.topLeft.y; y <= rect.bottomRight.y; y++) {
        for (let x = rect.topLeft.x; x <= rect.bottomRight.x; x++) {
            // We'll avoid providing all the vertices in order to avoid creating duplicates.
            // We only provide the top-left corner of the square if this is top-left square
            // of the grid, meaning (x, y) == (0, 0).
            if (x == rect.topLeft.x && y == rect.topLeft.y) {
                vertices.push(new paper.Point(x, y))
            }
            // We only provide the top-right corner of the square if this square is in the
            // top row of the grid, meaning y == 0.
            if (y == rect.topLeft.y) {
                vertices.push(new paper.Point(x + 1, y))
            }
            // We only provide the bottom-left corner of the square if this square is in the
            // left column of the grid, meaning x == 0.
            if (x == rect.topLeft.x) {
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

export function allTriangleIdxs(rect: paper.Rectangle): TriangleIdx[] {
    let triangles: TriangleIdx[] = []
    for (let x = rect.x; x < rect.right; x++) {
        for (let y = rect.y; y < rect.bottom; y++) {
            const cell = new paper.Point(x, y)
            for (const direction of CardinalSides) {
                triangles.push({
                    squareIdx: cell,
                    cardinalSide: direction
                })
            }
        }
    }
    return triangles
}

function makeTriangleForOriginSquare(cardinalSide: CardinalSide) {
    // Create a triangle for the N side of the square.
    const triangle = new paper.Path([
        new paper.Point(0, 0),
        new paper.Point(1, 0),
        new paper.Point(0.5, 0.5)
    ])
    triangle.closed = true
    // Rotate it for the requested cardinal side.
    triangle.rotate(
        {
            [SIDE.N]: 0,
            [SIDE.E]: 90,
            [SIDE.S]: 180,
            [SIDE.W]: 270
        }[cardinalSide],
        new paper.Point(0.5, 0.5)
    )
    return triangle
}

export function makeTrianglePolygon(triangleIdx: TriangleIdx): paper.Path {
    let triangle = makeTriangleForOriginSquare(triangleIdx.cardinalSide)
    triangle.translate(new paper.Point(triangleIdx.squareIdx.x, triangleIdx.squareIdx.y))
    return triangle
}

/**
 * Returns the rays that can be used to generate valid squares (aligned to the lattice).
 * The ray sizes indicate the valid step size to take in the direction of the ray.
 * @param vertex - The vertex from which to generate the rays
 */
export function squareDiagonalsFromVertex(vertex: paper.Point): paper.Point[] {
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
            rotatedRays.push(roundToHalfIntegerCoordinate(ray.rotate(angle, new paper.Point(0, 0))))
        }
    }
    return rotatedRays
}
