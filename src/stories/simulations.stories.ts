import { XORShift } from "random-seedable"
import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"
import { visualiseFoldSpec } from "./lib/visualize-fold"
import {
    detectSquare,
    ProceduralAnimation,
    randomlyChooseExpansionFold,
    detectRemovableRightIsosceles
} from "@/spontaneous"
import { sleep } from "@/lib/time"

export default {
    title: "Simulations"
}

export const rain = withCommonArgs(function rain(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 14, 14)
    let speedFactor = 3
    let { container, board } = rigamarole({
        bounds,
        zoom: 55,
        pixelWidth: 800,
        pixelHeight: 800,
        ...args,
        speedFactor: speedFactor
    })
    new ProceduralAnimation(board, bounds, 123456789).rainContinuously()
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
    board.shapes.get(1)!.fillColor = new paper.Color("#99ccff")
    let expansionRandom = new XORShift(123456789)
    const columnOffset = new paper.Point(10, 0)
    for (let i = 1; i <= 30; i++) {
        let oldShape = board.shapes.get(i)!
        let foldSpec: FoldSpec | null = null
        for (let attempt = 0; attempt < 20; attempt++) {
            foldSpec = randomlyChooseExpansionFold(oldShape, expansionRandom, bounds)
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
        annotationsLayer.addChild(visualiseFoldSpec(foldSpec, FOLD_ACTION.Expand))
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

export const removeSquares = withCommonArgs(function removeSquares(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 8, 8)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        ...args
    })
    ;(async () => {
        // Create a few squares
        const squares = [
            [new paper.Point(1, 0), new paper.Point(1, 2)],
            [new paper.Point(3, 0), new paper.Point(5, 2)],
            [new paper.Point(0, 3), new paper.Point(3, 6)]
        ]
        for (let i = 0; i < squares.length; i++) {
            let spec = FoldSpec.fromEndPoints(squares[i][0], squares[i][1], FOLD_COVER.Full)
            board.foldInstantaneously(i + 1, spec, FOLD_ACTION.Create)
        }
        await sleep(400)
        // Remove squares one by one using detectSquare
        for (let id of Array.from(board.shapes.keys())) {
            let shape = board.shapes.get(id)
            if (!shape) continue
            if (!detectSquare(shape)) continue
            // Pick a random i for FoldSpec.fromSquare
            let i = Math.floor(Math.random() * 4)
            let foldSpec = FoldSpec.fromSquare(shape, i)
            let viz = visualiseFoldSpec(foldSpec, FOLD_ACTION.Remove)
            annotationsLayer.addChild(viz)
            let fold = board.foldAsync(id, foldSpec, FOLD_ACTION.Remove)
            await sleep(600)
            viz.remove()
            await fold
        }
    })()
    return container
})

export const removeTriangles = withCommonArgs(function removeTriangles(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 8, 8)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        ...args
    })
    ;(async () => {
        // Create a few right isosceles triangles
        const triangles = [
            [new paper.Point(0, 0), new paper.Point(2, 2)],
            [new paper.Point(4, 0), new paper.Point(4, 2)]
        ]
        for (let i = 0; i < triangles.length; i++) {
            let spec = FoldSpec.fromEndPoints(triangles[i][0], triangles[i][1], FOLD_COVER.Right)
            board.foldInstantaneously(i + 1, spec, FOLD_ACTION.Create)
            // Add the third point to make a triangle
            // let shape = board.shapes.get(i + 1)
            // if (shape) {
            //     // shape.add(triangles[i][2])
            //     // shape.closed = true
            // }
        }
        await sleep(400)
        // Remove triangles one by one using detectRemovableRightIsosceles
        for (let id of Array.from(board.shapes.keys())) {
            let shape = board.shapes.get(id)
            if (!shape) continue
            let detection = detectRemovableRightIsosceles(shape)
            if (!detection) {
                continue
            }
            let { next, previous } = detection
            // Randomly choose left or right cover
            let foldSpec =
                Math.random() < 0.5
                    ? FoldSpec.fromEndPoints(next, previous, FOLD_COVER.Right)
                    : FoldSpec.fromEndPoints(previous, next, FOLD_COVER.Left)
            let viz = visualiseFoldSpec(foldSpec, FOLD_ACTION.Remove)
            annotationsLayer.addChild(viz)
            let fold = board.foldAsync(id, foldSpec, FOLD_ACTION.Remove)
            await sleep(600)
            viz.remove()
            await fold
        }
    })()
    return container
})
