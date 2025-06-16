import paper from "paper"
import { Board } from "@/animated-board"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold"
import { sleep } from "@/lib/time"
import { rigamarole } from "./rigamarole"
import { withCommonArgs } from "./common-args"
import type { CommonStoryArgs } from "./common-args"
import { roundToHalfIntegers } from "@/lib/tetrakis"

export default {
    title: "Patterns"
}

export const threeTriangles = withCommonArgs(function threeTriangles(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 3, 4)
    let { container, board } = rigamarole({
        bounds,
        zoom: 80,
        ...args
    })
    async function doFolds() {
        board.foldAsync(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
            FOLD_ACTION.Create
        )
        await sleep(1000)
        board.foldAsync(
            2,
            FoldSpec.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
            FOLD_ACTION.Create
        )
        await sleep(1000)
        board.foldAsync(
            3,
            FoldSpec.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
            FOLD_ACTION.Create
        )
    }
    doFolds()
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
