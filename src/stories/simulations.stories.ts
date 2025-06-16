import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
import {
    FOLD_ACTION,
    FOLD_COVER,
    FOLD_COVERS,
    FOLD_TEMPLATES,
    FoldSpec,
    SHAPE_CHANGE,
    type FoldAction
} from "@/lib/fold-spec"
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
import { FoldSpecBasis } from "@/lib/fold-spec-basis"

export default {
    title: "Simulations"
}

function randomlyChooseFullFold(shape: paper.Path, random: PRNG): FoldSpec | null {
    let clockwise = random.bool()
    let foldBases = FoldSpecBasis.getAllBases(shape, clockwise, false)
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
        speedFactor: 2
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
                let foldSpec = randomlyChooseFullFold(shape, expansionRandom)
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
): paper.Group {
    // do them as transparent gray triangles,
    // bit with a + or - sign in the middle (for add or remove) for each triangle
    let createdBits = new paper.Group()
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
        createdBits.addChild(clone)
        let text = new paper.PointText({
            content: symbol[shapeChange],
            point: midpoints[side].add(new paper.Point(0, 0.13)),
            fillColor: "#555a",
            fontSize: 0.4,
            justification: "center"
        })
        annotationsLayer.addChild(text)
        createdBits.addChild(text)
        let firstHingeDot = new paper.Path.Circle(foldSpec.hinges[0], 0.05)
        firstHingeDot.fillColor = new paper.Color("#555a")
        annotationsLayer.addChild(firstHingeDot)
        createdBits.addChild(firstHingeDot)
    }
    let endArrow = new paper.Path([
        foldSpec.end.add(foldSpec.hinges[0].subtract(foldSpec.end).normalize(0.2)),
        foldSpec.end,
        foldSpec.end.add(foldSpec.hinges[1].subtract(foldSpec.end).normalize(0.2))
    ])
    endArrow.strokeColor = new paper.Color("#555d")
    endArrow.strokeWidth = 0.04
    annotationsLayer.addChild(endArrow)
    createdBits.addChild(endArrow)
    return createdBits
}

export const parcel = withCommonArgs(function parcel(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 3, 3)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 80,
        ...args
    })
    async function doFolds() {
        let initialFoldSpec = FoldSpec.fromEndPoints(
            new paper.Point(1.5, 0.5),
            new paper.Point(1.5, 2.5)
        )
        let viz = visualiseFoldSpec(annotationsLayer, initialFoldSpec, FOLD_ACTION.Create)
        // await sleep(2000)
        await board.foldAsync(1, initialFoldSpec, FOLD_ACTION.Create)
        viz.remove()
        let inwardsFoldSpecs = []
        for (let i = 0; i < 4; i++) {
            inwardsFoldSpecs.push(
                FoldSpec.fromEndPoints(
                    roundToHalfIntegers(
                        new paper.Point(1.5, 1.5).add(
                            new paper.Point(1, 0).rotate(90 * i, new paper.Point(0, 0))
                        )
                    ),
                    new paper.Point(1.5, 1.5)
                )
            )
        }
        let inwardsViz = inwardsFoldSpecs.map(foldSpec =>
            visualiseFoldSpec(annotationsLayer, foldSpec, FOLD_ACTION.Contract)
        )
        await sleep(2000)
        inwardsViz.forEach(viz => viz.remove())
        for (let foldSpec of inwardsFoldSpecs) {
            await board.foldAsync(1, foldSpec, FOLD_ACTION.Contract)
        }
    }
    doFolds()
    return container
})

export const growthUnroll = withCommonArgs(function growthUnroll(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-4, -1, 15, 150)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 55,
        ...args
    })
    board.foldInstantaneously(
        1,
        FoldSpec.fromEndPoints(new paper.Point(2, 1), new paper.Point(0, 1), FOLD_COVER.Right),
        FOLD_ACTION.Create
    )
    let expansionRandom = new XORShift(123456789)
    const columnOffset = new paper.Point(7, 0)
    for (let i = 1; i <= 31; i++) {
        let oldShape = board.shapes.get(i)!
        let foldSpec = randomlyChooseFullFold(oldShape, expansionRandom)
        if (foldSpec == null) {
            break
        }
        let animationCopy = oldShape.clone()
        animationCopy.translate(columnOffset)
        board.addShape(-i, animationCopy)
        async function foreverAnimate() {
            let shiftedFoldSpec = foldSpec!.transform(new paper.Matrix().translate(columnOffset))
            let reverse = false
            let reversedFoldSpec = shiftedFoldSpec.reverse()
            let currentFoldAction: FoldAction = FOLD_ACTION.Expand
            while (true) {
                let currentFoldSpec = reverse ? reversedFoldSpec : shiftedFoldSpec
                currentFoldAction =
                    currentFoldAction == FOLD_ACTION.Expand
                        ? FOLD_ACTION.Contract
                        : FOLD_ACTION.Expand
                await board.foldAsync(-i, currentFoldSpec, currentFoldAction)
                reverse = !reverse
            }
        }
        foreverAnimate()
        visualiseFoldSpec(annotationsLayer, foldSpec, FOLD_ACTION.Expand)
        let foldSpecTriangles = foldSpec.toTriangles()
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
        let offsetY = Math.ceil(shapeHeight + 1.5)

        let initialClone = oldShape.clone()
        initialClone.translate(new paper.Point(0, offsetY))
        board.addShape(i + 1, initialClone)
        let offsetTransform = new paper.Matrix().translate(new paper.Point(0, offsetY))
        let redoneFoldSpec = foldSpec.transform(offsetTransform)
        board.foldInstantaneously(i + 1, redoneFoldSpec, FOLD_ACTION.Expand)
    }
    return container
})
