import paper from "paper"
import { FOLD_COVER, type FoldCover } from "./fold-spec"

/**
 * Check if the coordinates are integers. Can be used both to check if
 * the coordinates are valid cell indices or also if they lie along the
 * square-corners part of the Tetrakis grid. Does not check bounds.
 */
export function isOnGrid(point: paper.Point) {
    return Number.isInteger(point.x) && Number.isInteger(point.y)
}

export function roundToGrid(point: paper.Point): paper.Point {
    let result = point.round()
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

    for (let y = rect.topLeft.y; y < rect.bottomRight.y; y++) {
        for (let x = rect.topLeft.x; x < rect.bottomRight.x; x++) {
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
        }
    }

    return vertices
}

/**
 * Returns the rays that can be used to generate valid squares (aligned to the grid).
 * The ray sizes indicate the valid step size to take in the direction of the ray.
 * @param vertex - The vertex from which to generate the rays
 */
export function squareDiagonalRays(vertex: paper.Point, foldCover: FoldCover): paper.Point[] {
    let templateRays: paper.Point[] = []
    if (isOnGrid(vertex)) {
        // Case where the vertices are along the (0, 0) subgrid
        templateRays.push(new paper.Point(foldCover == FOLD_COVER.Full ? 2 : 1, 0))
        templateRays.push(new paper.Point(1, 1))
    } else {
        // Catch invalid vertices
        throw new Error(`Invalid vertex provided (${vertex.x}, ${vertex.y})`)
    }
    let rotatedRays: paper.Point[] = []
    // For both cases, the problem is symmetric along 90-degree rotation.
    // So we can produce the remaining rays by rotating the template rays.
    for (let angle of [0, 90, 180, 270]) {
        for (let ray of templateRays) {
            rotatedRays.push(roundToGrid(ray.rotate(angle, new paper.Point(0, 0))))
        }
    }
    return rotatedRays
}

export function hingeLengthFactors(
    origin: paper.Point,
    vector: paper.Point,
    fullCover: boolean
): number {
    // Check the origin is on the grid.
    if (!isOnGrid(origin)) {
        throw new Error(`Invalid origin coordinates: (${origin.x}, ${origin.y})`)
    }
    // Check the vector is either axis-aligned or diagonal.
    let isAxisAligned = vector.x == 0 || vector.y == 0
    if (!isAxisAligned) {
        if (Math.abs(vector.x) != Math.abs(vector.y)) {
            throw new Error(`Vector not perfectly diagonal: (${vector.x}, ${vector.y})`)
        }
    }
    if (isAxisAligned) {
        return fullCover ? 2 : 1
    } else {
        return Math.sqrt(2)
    }
}

// export function areHalfCoversValid(vertex: paper.Point, ray: paper.Point) {
//     // Cases:
//     // If the vertex is on the corners of the squares
//     //   AND the ray is axis aligned
//     //     AND the length of the ray is divisible by 2, then the half covers are valid.
//     //     OTHERWISE, only the full cover is valid.
//     //   AND the ray is diagonal, all covers are valid
//     // If the vertex is in the middle of the squares
//     //   AND the ray is axis aligned
//     //     AND the length of the ray is divisible by 2, then the half covers are valid.
//     //     OTHERWISE, only the full cover is valid.
//     //   AND the ray is diagonal, all covers are valid
//     let isAxisAligned = ray.x == 0 || ray.y == 0
//     let halfCoversAreValid = false
//     if (isOnGrid(vertex)) {
//         // Vertex is on the corners of the squares
//         if (isAxisAligned) {
//             if (ray.length % 2 == 0) {
//                 halfCoversAreValid = true
//             }
//         } else {
//             halfCoversAreValid = true
//         }
//     } else if (isOnTetrakisGrid(vertex)) {
//         // Vertex is in the middle of the squares
//         if (isAxisAligned) {
//             if (ray.length % 2 == 0) {
//                 halfCoversAreValid = true
//             }
//         } else {
//             halfCoversAreValid = true
//         }
//     } else {
//         throw new Error(`Invalid vertex provided (${vertex.x}, ${vertex.y})`)
//     }
//     return halfCoversAreValid
// }
