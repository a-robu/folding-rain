import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FOLD_COVERS, FoldSpec } from "@/lib/fold"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { rigamarole } from "./rigamarole"
import { exponentialDelay, sleep } from "@/lib/time"
import type { Board } from "@/animated-board"
import {
    allVertices,
    roundToHalfIntegers,
    squareDiagonalsFromVertex,
    areHalfCoversValid
} from "@/lib/tetrakis"
import { withCommonArgs } from "./common-args"
import type { CommonStoryArgs } from "./common-args"

export default {
    title: "Rain"
}

function tryExpand(board: Board, random: PRNG) {
    if (board.shapes.size == 0) {
        console.log("No shapes to expand.")
        return
    }

    for (let attempt = 0; attempt < 10; attempt++) {
        // Pick a random shape
        let shapeId = random.choice(Array.from(board.shapes.keys()))
        let shape = board.shapes.get(shapeId)!
        if (!shape || shape.segments.length < 2) {
            console.log("Shape is missing or has less than 2 segments.", shapeId)
            continue
        }

        // Pick a random edge (segment)
        let segIdx = Math.abs(random.int()) % shape.segments.length
        let segA = shape.segments[segIdx]
        let segB = segA.next
        let A = segA.point
        let B = segB.point
        let baseVec = B.subtract(A)
        if (baseVec.length === 0) {
            console.log("Base vector has zero length.", A, B)
            continue
        }

        let best = null
        let bestScale = 0
        // Only try the outward direction for clockwise polygons: sign = 1
        let sign = 1
        for (let scale = 0.5; scale <= 6; scale += 0.5) {
            let perp = baseVec
                .rotate(90 * sign, new paper.Point(0, 0))
                .normalize(baseVec.length * scale)
            let apex = A.add(baseVec.multiply(0.5)).add(perp.multiply(0.5 / baseVec.length))
            apex = roundToHalfIntegers(apex)

            // For expansion, apex should be OUTSIDE the shape
            if (shape.contains(apex)) {
                console.log("Apex is inside shape (should be outside for expansion):", {
                    apex: apex.toString(),
                    A: A.toString(),
                    B: B.toString(),
                    baseVec: baseVec.toString(),
                    baseVecLength: baseVec.length,
                    scale,
                    sign,
                    perp: perp.toString(),
                    apexMidpoint: A.add(baseVec.multiply(0.5)).toString(),
                    apexOffset: perp.multiply(0.5 / baseVec.length).toString(),
                    shapeId,
                    segIdx
                })
                break
            }

            // Build the triangle path
            let tri = new paper.Path([A, B, apex])
            tri.closed = true

            // Check if triangle overlaps the shape except for the base edge
            // We'll check that the triangle does not contain any points inside the shape except A and B
            let triMid1 = tri.getPointAt(tri.length * 0.25)
            let triMid2 = tri.getPointAt(tri.length * 0.75)
            if (shape.contains(triMid1) || shape.contains(triMid2)) {
                console.log("Triangle overlaps shape at scale", scale, "sign", sign)
                tri.remove()
                break
            }

            // If valid, keep as best so far
            if (scale > bestScale) {
                best = { apex, sign, scale }
                bestScale = scale
            }
            tri.remove()
        }
        if (best) {
            // Compute the reflection of apex across the edge AB
            let { apex } = best
            let AB = B.subtract(A)
            let mid = A.add(AB.multiply(0.5))
            let apexToMid = mid.subtract(apex)
            let end = mid.add(apexToMid)
            end = roundToHalfIntegers(end)

            // Check for collisions with other shapes (for the new triangle to be added)
            let newTri = new paper.Path([A, B, end])
            newTri.closed = true
            let contacts = board.findPolygonContacts(newTri)
            if (contacts.shapeIds.length > 0 || contacts.lockShapeIds.length > 0) {
                console.log("Collision detected for new triangle at edge", segIdx, "end:", end)
                newTri.remove()
                continue
            }

            // Use apex as start, [A, B] as hinges, end as end
            console.log("Expanding shape", shapeId, "at edge", segIdx, "apex:", apex, "end:", end)
            let unfoldPlan = new FoldSpec(apex, [A, B], end)
            board.fold(shapeId, unfoldPlan, FOLD_ACTION.Expand)
            newTri.remove()
            return
        } else {
            console.log("No valid expansion found for shape", shapeId)
        }
    }
}

function tryCreate(board: Board, bounds: paper.Rectangle, random: PRNG) {
    for (let attempt = 0; attempt < 10; attempt++) {
        let startVertex = random.choice(allVertices(bounds))
        let ray = random.choice(squareDiagonalsFromVertex(startVertex))
        let rayMultiplier = randomChoiceWeighted(
            random,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            normalise([100, 50, 25, 10, 5, 2, 1, 1, 1, 1])
        )
        let vector = ray.multiply(rayMultiplier)
        let endVertex = roundToHalfIntegers(startVertex.add(vector))
        let halfCoversAreValid = areHalfCoversValid(startVertex, vector)
        let foldCovers = halfCoversAreValid ? FOLD_COVERS : [FOLD_COVER.Full]
        let foldCover = random.choice(foldCovers)
        let unfoldPlan = FoldSpec.fromEndPoints(startVertex, endVertex, foldCover)
        let quad = unfoldPlan.toQuad()
        // Check if the plan is within the bounds of the lattice
        if (quad.segments.some(segment => !bounds.contains(segment.point))) {
            continue
        }
        let contacts = board.findPolygonContacts(quad)
        if (contacts.shapeIds.length > 0 || contacts.lockShapeIds.length > 0) {
            continue
        }
        // // Check if the plan's touches the perimeter of any other shape
        // if (Array.from(board.shapes.values()).some(shape => shape.intersects(quad))) {
        //     continue
        // }
        // // Check if a point of the plan is contained within any existing shape
        // if (
        //     Array.from(board.shapes.values()).some(shape =>
        //         shape.contains(quad.segments[0].point)
        //     )
        // ) {
        //     continue
        // }

        let unusedIndex = board.shapes.size == 0 ? 1 : Math.max(...board.shapes.keys()) + 1
        board.fold(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
        return
    }
}

export const rain = withCommonArgs(function rain(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 14, 14)
    let { container, board } = rigamarole({
        bounds,
        zoom: 55,
        pixelWidth: 800,
        pixelHeight: 800,
        drawGridLines: args.drawGridLines,
        latticeAvailability: args.latticeAvailability,
        latticeContactid: args.latticeContactid,
        showShapeId: args.showShapeId
    })
    async function doFolds() {
        let random = new XORShift(123456789)
        tryCreate(board, bounds, random)
        for (let i = 0; i < 10; i++) {
            tryExpand(board, random)
        }
        await sleep(1000)
    }
    doFolds()
    return container
})
