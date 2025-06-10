import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
// import { XORShift } from "random-seedable"
import { FOLD_TYPE, FoldSpec } from "@/lib/fold"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { rigamarole } from "./rigamarole"
import { exponentialDelay, sleep } from "@/lib/time"
// import { roundVertexToHalfIntegers } from "@/lib/integers"
// import type { Lattice } from "@/lib/lattice"
import type { AnimatedBoard } from "@/animated-board"
import {
    allVertices,
    roundToHalfIntegerCoordinate,
    squareDiagonalsFromVertex
} from "@/lib/tetrakis"

export default {
    title: "Rain"
}

function tryExpand(animatedBoard: AnimatedBoard, random: PRNG) {
    if (animatedBoard.shapes.size == 0) {
        return
    }

    for (let attempt = 0; attempt < 10; attempt++) {
        // pick a random shape
        let shapeId = random.choice(Array.from(animatedBoard.shapes.keys()))
        let shape = animatedBoard.shapes.get(shapeId)!
        // Filter to find the "pointy corners" of the shape (<= 90 degrees)
        let pointyCorners = shape.segments.filter(segment => {
            let vectorToNext = segment.point.subtract(segment.next.point)
            let vectorToPrev = segment.point.subtract(segment.previous.point)
            return vectorToNext.dot(vectorToPrev) >= 0
        })
        if (pointyCorners.length == 0) {
            continue
        }
        let pointyCorner = random.choice(pointyCorners)
        // The apex of the corner is going to be one of the hinges of the fold
        // And the edges away from the apex will be either the hinge of the fold
        // or one of the edges of the triangle folds.
    }
}

function tryCreate(
    animatedBoard: AnimatedBoard,
    annotationsLayer: paper.Layer,
    bounds: paper.Rectangle,
    random: PRNG
) {
    for (let attempt = 0; attempt < 10; attempt++) {
        let startVertex = random.choice(allVertices(bounds))
        let ray = random.choice(squareDiagonalsFromVertex(startVertex))
        let rayMultiplier = randomChoiceWeighted(
            random,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            normalise([100, 50, 25, 10, 5, 2, 1, 1, 1, 1])
        )
        let endVertex = roundToHalfIntegerCoordinate(startVertex.add(ray.multiply(rayMultiplier)))
        let unfoldPlan = FoldSpec.fromEndPoints(startVertex, endVertex)
        let quad = unfoldPlan.toQuad()
        // Check if the plan is within the bounds of the lattice
        if (quad.segments.some(segment => !bounds.contains(segment.point))) {
            continue
        }
        // Check if the plan's touches the perimeter of any other shape
        if (Array.from(animatedBoard.shapes.values()).some(shape => shape.intersects(quad))) {
            continue
        }
        // Check if a point of the plan is contained within any existing shape
        if (
            Array.from(animatedBoard.shapes.values()).some(shape =>
                shape.contains(quad.segments[0].point)
            )
        ) {
            continue
        }

        let unusedIndex =
            animatedBoard.shapes.size == 0 ? 1 : Math.max(...animatedBoard.shapes.keys()) + 1
        animatedBoard.fold(unusedIndex, unfoldPlan, FOLD_TYPE.Create)
        let label = new paper.PointText({
            content: unusedIndex,
            point: startVertex.add(ray.multiply(rayMultiplier / 2)).add(new paper.Point(0, 0.16)),
            fillColor: "black",
            fontSize: 0.5,
            justification: "center",
            fontFamily: "Courier New"
        })
        annotationsLayer.addChild(label)
        return
    }
}

export function rain() {
    let bounds = new paper.Rectangle(0, 0, 14, 14)
    let { container, animatedBoard, annotationsLayer } = rigamarole({
        bounds,
        zoom: 55,
        pixelWidth: 800,
        pixelheight: 800
    })

    // let board = ...

    async function doFolds() {
        // board.fold()
        // board.onFold
        // acquireLock
        // lock.release()

        let random = new XORShift(123456789)

        while (true) {
            for (let i = 0; i < 10; i++) {
                tryExpand(animatedBoard, random)
            }
            tryCreate(animatedBoard, annotationsLayer, bounds, random)
            // animatedBoard.shapes.get(i)
            await sleep(1000)
            // await sleep(exponentialDelay(10))
        }

        // while (choices.length > 0) {
        //     let index = Math.floor(Math.random() * choices.length)
        //     let [x, y] = choices[index]
        //     choices.splice(index, 1)

        //     let topLeft = new paper.Point(x, y).multiply(2)
        //     animatedBoard.fold(
        //         i,
        //         FoldCoordinates.fromEndPoints(topLeft, topLeft.add(new paper.Point(1, 1))),
        //         FOLD_COLORING.Create
        //     )
        //     await sleep(exponentialDelay(10))
        //     // fold.onDone()
        //     i++
        // }

        // visualBoard.fold(
        //     1,
        //     FoldCoordinates.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
        //     FOLD_COLORING.Create
        // )
        // await sleep(1000)

        // visualBoard.fold(
        //     2,
        //     FoldCoordinates.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
        //     FOLD_COLORING.Create
        // )
        // await sleep(1000)

        // visualBoard.fold(
        //     3,
        //     FoldCoordinates.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
        //     FOLD_COLORING.Create
        // )
    }

    doFolds()

    return container
}
