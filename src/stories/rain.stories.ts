import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FOLD_COVERS, FoldSpec } from "@/lib/fold"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { rigamarole } from "./rigamarole"
import { exponentialDelay, sleep } from "@/lib/time"
import type { AnimatedBoard } from "@/animated-board"
import {
    allVertices,
    roundToHalfIntegers,
    squareDiagonalsFromVertex,
    areHalfCoversValid
} from "@/lib/tetrakis"
import { LabelViz } from "./label-viz"

export default {
    title: "Rain",
    argTypes: {
        drawGridLines: { control: "boolean", defaultValue: true },
        contactViz: { control: "boolean", defaultValue: false },
        showLabels: { control: "boolean", defaultValue: false }
    }
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
        let contacts = animatedBoard.findPolygonContacts(quad)
        if (contacts.shapeIds.length > 0 || contacts.lockShapeIds.length > 0) {
            continue
        }
        // // Check if the plan's touches the perimeter of any other shape
        // if (Array.from(animatedBoard.shapes.values()).some(shape => shape.intersects(quad))) {
        //     continue
        // }
        // // Check if a point of the plan is contained within any existing shape
        // if (
        //     Array.from(animatedBoard.shapes.values()).some(shape =>
        //         shape.contains(quad.segments[0].point)
        //     )
        // ) {
        //     continue
        // }

        let unusedIndex =
            animatedBoard.shapes.size == 0 ? 1 : Math.max(...animatedBoard.shapes.keys()) + 1
        animatedBoard.fold(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
        return
    }
}

export function rain(args: { drawGridLines: boolean; contactViz: boolean; showLabels: boolean }) {
    let bounds = new paper.Rectangle(0, 0, 14, 14)
    let { container, animatedBoard, annotationsLayer } = rigamarole({
        bounds,
        zoom: 55,
        pixelWidth: 800,
        pixelheight: 800,
        drawGridLines: args.drawGridLines,
        contactViz: args.contactViz
    })
    let labelViz: LabelViz | undefined
    if (args.showLabels) {
        labelViz = new LabelViz(annotationsLayer, animatedBoard)
    }
    // If toggling off, remove listeners and labels (optional: not implemented for brevity)
    async function doFolds() {
        let random = new XORShift(123456789)
        while (true) {
            for (let i = 0; i < 10; i++) {
                tryExpand(animatedBoard, random)
            }
            tryCreate(animatedBoard, annotationsLayer, bounds, random)
            await sleep(1000)
        }
    }
    doFolds()
    return container
}
rain.args = {
    drawGridLines: true,
    contactViz: false,
    showLabels: false
}
