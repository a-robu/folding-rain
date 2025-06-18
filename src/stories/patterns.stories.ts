import paper from "paper"
import { Board } from "@/board"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { sleep } from "@/lib/time"
import { rigamarole } from "./rigamarole"
import { withCommonArgs } from "./common-args"
import type { CommonStoryArgs } from "./common-args"
import { visualiseFoldSpec } from "./visualize-fold"

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
        let spec1 = FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1))
        let viz1 = visualiseFoldSpec(annotationsLayer, spec1, FOLD_ACTION.Create)
        board.foldAsync(1, spec1, FOLD_ACTION.Create)
        await sleep(500)
        viz1.remove()
        await sleep(500)

        let spec2 = FoldSpec.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4))
        let viz2 = visualiseFoldSpec(annotationsLayer, spec2, FOLD_ACTION.Create)
        board.foldAsync(2, spec2, FOLD_ACTION.Create)
        await sleep(500)
        viz2.remove()
        await sleep(500)

        let spec3 = FoldSpec.fromEndPoints(new paper.Point(3, 0), new paper.Point(3, 2))
        let viz3 = visualiseFoldSpec(annotationsLayer, spec3, FOLD_ACTION.Create)
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

async function makeFlower(board: Board, center: paper.Point, id: number) {
    await board.foldAsync(
        id,
        FoldSpec.fromEndPoints(
            new paper.Point(center.x, center.y + 1),
            new paper.Point(center.x, center.y - 1)
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
                    new paper.Point(center.x + dx, center.y + dy)
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
                    new paper.Point(center.x + dx, center.y + dy)
                ),
                FOLD_ACTION.Expand
            )
        )
    }

    await Promise.all(thirdFolds)
}
