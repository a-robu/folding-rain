import type PRNG from "random-seedable/@types/PRNG"
import { XORShift } from "random-seedable"
import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { rigamarole } from "./lib/rigamarole"
import { exponentialDelay, sleep } from "@/lib/time"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"
import { visualiseFoldSpec } from "./lib/visualize-fold"
import {
    ProceduralAnimation,
    randomlyChooseContractionFold,
    randomlyChooseExpansionFold,
    tryCreate
} from "@/spontaneous"
import type { Board } from "@/board"

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
