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
import type { Board } from "@/board"
import {
    allVertices,
    roundToHalfIntegers,
    squareDiagonalsFromVertex,
    areHalfCoversValid
} from "@/lib/tetrakis"
import { withCommonArgs } from "./common-args"
import type { CommonStoryArgs } from "./common-args"
import { FoldSpecBasis } from "@/lib/fold-spec-basis"
import { visualiseFoldSpec } from "./visualize-fold"
import { verificationAllOk, verifyFold } from "@/lib/contacts"

export default {
    title: "Simulations"
}

function randomlyChooseFold(
    shape: paper.Path,
    random: PRNG,
    bounds: paper.Rectangle
): FoldSpec | null {
    let clockwise = random.bool()
    let fullCover = random.bool()
    let foldBases = FoldSpecBasis.getAllBases(shape, clockwise, fullCover)
    if (foldBases.length == 0) {
        return null
    }
    let basis = random.choice(foldBases) as FoldSpecBasis
    let foldSpec = basis.atMultiplier(basis.maxMultiplier(3))
    let verification = verifyFold(
        shape.data.board,
        bounds,
        foldSpec,
        FOLD_ACTION.Expand,
        shape.data.id
    )
    if (!verificationAllOk(verification)) {
        return null
    }
    // let triangles = foldSpec.toTriangles()
    // if (!bounds.contains(triangles.far.bounds)) {
    //     return null
    // }
    // let innerIntersection = triangles.near.intersect(shape)
    // let innerAreaDiff = Math.abs((innerIntersection as paper.Path).area - triangles.near.area)
    // if (innerAreaDiff > 0.01) {
    //     return null
    // }
    // let outerIntersection = triangles.far.intersect(shape)
    // let outerArea = (outerIntersection as paper.Path).area
    // if (outerArea > 0.01) {
    //     return null
    // }
    // if (intersection.area)
    return foldSpec
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

        if (!verificationAllOk(verifyFold(board, bounds, unfoldPlan, FOLD_ACTION.Create))) {
            continue
        }

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
                if (random.float() < 0.2) {
                    await tryCreate(board, bounds, random)
                }
                let shapeId: number | null = null
                let foldSpec: FoldSpec | null = null
                for (let attempt = 0; attempt < 100; attempt++) {
                    shapeId = random.choice(Array.from(board.shapes.keys()))
                    let shape = board.shapes.get(shapeId!)
                    foldSpec = randomlyChooseFold(shape!, expansionRandom, bounds)
                    if (foldSpec) {
                        break
                    }
                    console.log("no fold spec found, trying again")
                    await sleep(50)
                }
                if (!foldSpec) {
                    break
                }
                await board.foldAsync(shapeId!, foldSpec, FOLD_ACTION.Expand)
                // await sleep(exponentialDelay(1))
            }
        }
        console.log("ceased operation")
    }
    doFolds()
    return container
})

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
    let bounds = new paper.Rectangle(-4, -1, 23, 150)
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
    const columnOffset = new paper.Point(10, 0)
    for (let i = 1; i <= 30; i++) {
        let oldShape = board.shapes.get(i)!
        let foldSpec: FoldSpec | null = null
        for (let attempt = 0; attempt < 20; attempt++) {
            foldSpec = randomlyChooseFold(oldShape, expansionRandom, bounds)
            if (foldSpec != null) {
                break
            }
        }
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
            while (true) {
                let currentFoldSpec = reverse ? reversedFoldSpec : shiftedFoldSpec
                let currentFoldAction = reverse ? FOLD_ACTION.Contract : FOLD_ACTION.Expand
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
