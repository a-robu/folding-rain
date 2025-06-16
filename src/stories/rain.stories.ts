import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
import {
    FOLD_ACTION,
    FOLD_COVER,
    FOLD_COVERS,
    FOLD_TEMPLATES,
    FoldSpec,
    FoldSpecBasis,
    SHAPE_CHANGE,
    type FoldAction
} from "@/lib/fold"
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

function randomlyChooseExpansion(shape: paper.Path, random: PRNG): FoldSpec | null {
    let clockwise = random.bool()
    let foldBases = FoldSpecBasis.getAllBases(shape, clockwise, true)
    if (foldBases.length == 0) {
        return null
    }
    let basis = random.choice(foldBases) as FoldSpecBasis
    return basis.atMultiplier(basis.maxMultiplier())
}

function tryCreate(board: Board, bounds: paper.Rectangle, random: PRNG): Promise<void> | null {
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
        return board.foldAsync(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
    }
    return null
}

export const rain = withCommonArgs(function rain(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 14, 14)
    let { container, board } = rigamarole({
        bounds,
        zoom: 55,
        pixelWidth: 800,
        pixelHeight: 800,
        ...args,
        speedFactor: 0.5
    })
    async function doFolds() {
        let random = new XORShift(123456789)
        let expansionRandom = new XORShift(123456789)
        let creating = tryCreate(board, bounds, random)
        if (creating) {
            await creating
            while (true) {
                // Log a complete backup of the board (all current polygons)
                // as a JSON in the requested format: { id: [[x, y], ...], ... }
                // const shapesObj = Object.fromEntries(
                //     Array.from(board.shapes.entries()).map(([id, shape]) => [
                //         id,
                //         shape.segments.map(seg => [seg.point.x, seg.point.y])
                //     ])
                // )
                // console.log("Current board state:", JSON.stringify(shapesObj, null, 2))
                let shapeId = random.choice(Array.from(board.shapes.keys()))
                let shape = board.shapes.get(shapeId)!
                let foldSpec = randomlyChooseExpansion(shape, expansionRandom)
                if (!foldSpec) {
                    break
                }
                let expansion = board.foldAsync(shapeId, foldSpec, FOLD_ACTION.Expand)
                if (expansion) {
                    await expansion
                } else {
                    break
                }
            }
        }
    }
    doFolds()
    return container
})

function visualiseFoldSpec(
    annotationsLayer: paper.Layer,
    foldSpec: FoldSpec,
    foldAction: FoldAction
) {
    // do them as transparent gray triangles,
    // bit with a + or - sign in the middle (for add or remove) for each triangle
    let foldSpecTriangles = foldSpec.toTriangles()
    let foldTemplate = FOLD_TEMPLATES[foldAction]
    let symbol = {
        [SHAPE_CHANGE.Add]: "+",
        [SHAPE_CHANGE.Remove]: "-",
        [SHAPE_CHANGE.Keep]: "•"
    }
    let hingeCenter = foldSpec.hinges[0].add(foldSpec.hinges[1]).divide(2)
    let midpoints = {
        near: foldSpec.start.add(hingeCenter).divide(2),
        far: foldSpec.end.add(hingeCenter).divide(2)
    }
    for (let side of ["near", "far"] as const) {
        let triangle = foldSpecTriangles[side]
        let clone = triangle.clone()
        let shapeChange = foldTemplate[side]
        if (shapeChange == SHAPE_CHANGE.Keep) {
            clone.strokeColor = new paper.Color("#555a")
            clone.strokeWidth = 0.03
            clone.dashArray = [0.1, 0.04]
        } else if (shapeChange == SHAPE_CHANGE.Add) {
            clone.fillColor = new paper.Color("#0f06")
        } else if (shapeChange == SHAPE_CHANGE.Remove) {
            clone.fillColor = new paper.Color("#f006")
        }
        annotationsLayer.addChild(clone)
        let text = new paper.PointText({
            content: symbol[shapeChange],
            point: midpoints[side].add(new paper.Point(0, 0.13)),
            fillColor: "#555a",
            fontSize: 0.4,
            justification: "center"
        })
        annotationsLayer.addChild(text)
    }
}

export const progression = withCommonArgs(function progression(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-2, -1, 7, 40)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 55,
        ...args,
        speedFactor: 0.5
    })
    board.foldInstantaneously(
        1,
        FoldSpec.fromEndPoints(new paper.Point(2, 1), new paper.Point(0, 1), FOLD_COVER.Right),
        FOLD_ACTION.Create
    )
    function pickFoldSpec(shape: paper.Path): FoldSpec | null {
        let foldBases = FoldSpecBasis.getAllBases(shape, true, true)
        if (foldBases.length == 0) {
            return null
        }
        let basis = foldBases[0]
        return basis.atMultiplier(basis.maxMultiplier())
    }
    let expansionRandom = new XORShift(123456789)
    for (let i = 1; i <= 100; i++) {
        let oldShape = board.shapes.get(i)!
        let foldSpec = randomlyChooseExpansion(oldShape, expansionRandom)
        if (foldSpec == null) {
            break
        }
        visualiseFoldSpec(annotationsLayer, foldSpec, FOLD_ACTION.Expand)
        let foldSpecTriangles = foldSpec.toTriangles()
        // for (let triangle of Object.values(foldSpecTriangles)) {
        //     let clone = triangle.clone()
        //     clone.strokeColor = new paper.Color("#7fc60b")
        //     clone.strokeWidth = 0.05
        //     annotationsLayer.addChild(clone)
        // }

        let shapeTop = Math.min(
            oldShape.bounds.top,
            foldSpecTriangles.near.bounds.top,
            foldSpecTriangles.far.bounds.top
        )
        let shapeBottom = Math.max(
            oldShape.bounds.bottom,
            foldSpecTriangles.near.bounds.bottom,
            foldSpecTriangles.far.bounds.bottom
        )
        let shapeHeight = shapeBottom - shapeTop
        let offsetY = Math.ceil(shapeHeight + 0.5)

        let initialClone = oldShape.clone()
        initialClone.translate(new paper.Point(0, offsetY))
        board.addShape(i + 1, initialClone)
        let redoneFoldSpec = pickFoldSpec(board.shapes.get(i + 1)!)!
        board.foldInstantaneously(i + 1, redoneFoldSpec, FOLD_ACTION.Expand)
    }
    return container
})
