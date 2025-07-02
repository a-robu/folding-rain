import paper from "paper"
import { Board } from "@/board"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { sleep } from "@/lib/time"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"
import { visualiseFoldSpec } from "./lib/visualize-fold"
import { roundToGrid } from "@/lib/grid"
// import { detectSquare } from "@/spontaneous"

export default {
    title: "Patterns"
}

export const threeTriangles = withCommonArgs(function threeTriangles(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 6, 6)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 80,
        ...args
    })
    ;(async () => {
        let spec1 = FoldSpec.fromEndPoints(
            new paper.Point(0, 0),
            new paper.Point(1, 1),
            FOLD_COVER.Full
        )
        let viz1 = visualiseFoldSpec(spec1, FOLD_ACTION.Create)
        annotationsLayer.addChild(viz1)
        board.foldAsync(1, spec1, FOLD_ACTION.Create)
        await sleep(500)
        viz1.remove()
        await sleep(500)

        let spec2 = FoldSpec.fromEndPoints(
            new paper.Point(0, 2),
            new paper.Point(2, 4),
            FOLD_COVER.Full
        )
        let viz2 = visualiseFoldSpec(spec2, FOLD_ACTION.Create)
        annotationsLayer.addChild(viz2)
        board.foldAsync(2, spec2, FOLD_ACTION.Create)
        await sleep(500)
        viz2.remove()
        await sleep(500)

        let spec3 = FoldSpec.fromEndPoints(
            new paper.Point(3, 0),
            new paper.Point(3, 2),
            FOLD_COVER.Full
        )
        let viz3 = visualiseFoldSpec(spec3, FOLD_ACTION.Create)
        annotationsLayer.addChild(viz3)
        board.foldAsync(3, spec3, FOLD_ACTION.Create)
        await sleep(500)
        viz3.remove()
        await sleep(500)
    })()
    return container
})

export const flower = withCommonArgs(function flower(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 4, 4)
    let { container, board } = rigamarole({
        bounds,
        zoom: 100,
        ...args
    })
    makeFlower(board, new paper.Point(2, 2), 1)
    return container
})

export const fourFlowers = withCommonArgs(function fourFlowers(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 9, 9)
    let { container, board } = rigamarole({
        bounds,
        zoom: 45,
        ...args
    })
    let id = 1
    for (let center of [
        new paper.Point(2, 2),
        new paper.Point(2, 7),
        new paper.Point(7, 2),
        new paper.Point(7, 7)
    ]) {
        makeFlower(board, center, id++)
    }
    return container
})

export const parcel = withCommonArgs(function parcel(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 6, 6)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        ...args
    })
    ;(async () => {
        let initialFoldSpec = FoldSpec.fromEndPoints(
            new paper.Point(2, 0),
            new paper.Point(2, 4),
            FOLD_COVER.Full
        )
        let viz = visualiseFoldSpec(initialFoldSpec, FOLD_ACTION.Create)
        let fold = board.foldAsync(1, initialFoldSpec, FOLD_ACTION.Create)
        annotationsLayer.addChild(viz)
        await sleep(500)
        viz.remove()
        await fold
        let inwardsFoldSpecs = []
        for (let i = 0; i < 4; i++) {
            inwardsFoldSpecs.push(
                FoldSpec.fromEndPoints(
                    roundToGrid(
                        new paper.Point(2, 2).add(
                            new paper.Point(2, 0).rotate(90 * i, new paper.Point(0, 0))
                        )
                    ),
                    new paper.Point(2, 2),
                    FOLD_COVER.Full
                )
            )
        }
        for (let foldSpec of inwardsFoldSpecs) {
            let viz = visualiseFoldSpec(foldSpec, FOLD_ACTION.Contract)
            annotationsLayer.addChild(viz)
            let fold = board.foldAsync(1, foldSpec, FOLD_ACTION.Contract)
            await sleep(500)
            viz.remove()
            await fold
        }
    })()
    return container
})

async function makeFlower(board: Board, center: paper.Point, id: number) {
    await board.foldAsync(
        id,
        FoldSpec.fromEndPoints(
            new paper.Point(center.x, center.y + 1),
            new paper.Point(center.x, center.y - 1),
            FOLD_COVER.Full
        ),
        FOLD_ACTION.Create
    )
    let secondFolds = []

    for (let [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
    ]) {
        secondFolds.push(
            board.foldAsync(
                id,
                FoldSpec.fromEndPoints(
                    new paper.Point(center.x, center.y),
                    new paper.Point(center.x + dx, center.y + dy),
                    FOLD_COVER.Full
                ),
                FOLD_ACTION.Expand
            )
        )
    }

    await Promise.all(secondFolds)

    let thirdFolds = []

    for (let [dx, dy] of [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0]
    ]) {
        thirdFolds.push(
            board.foldAsync(
                id,
                FoldSpec.fromEndPoints(
                    new paper.Point(center.x, center.y),
                    new paper.Point(center.x + dx, center.y + dy),
                    FOLD_COVER.Full
                ),
                FOLD_ACTION.Expand
            )
        )
    }

    await Promise.all(thirdFolds)
}
