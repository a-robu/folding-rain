import paper from "paper"
import { AnimatedBoard } from "@/animated-board"
import { FOLD_TYPE, FoldSpec } from "@/lib/fold"
import { sleep } from "@/lib/time"
import { rigamarole } from "./rigamarole"

export default {
    title: "Patterns"
}

export function threeTriangles() {
    let bounds = new paper.Rectangle(0, 0, 3, 4)
    let { container, animatedBoard } = rigamarole({ bounds, zoom: 80 })

    async function doFolds() {
        animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
            FOLD_TYPE.Create
        )
        await sleep(1000)

        animatedBoard.fold(
            2,
            FoldSpec.fromEndPoints(new paper.Point(0, 2), new paper.Point(2, 4)),
            FOLD_TYPE.Create
        )
        await sleep(1000)

        animatedBoard.fold(
            3,
            FoldSpec.fromEndPoints(new paper.Point(2.5, 0.5), new paper.Point(2.5, 1.5)),
            FOLD_TYPE.Create
        )
    }

    doFolds()

    return container
}

async function makeFlower(animatedBoard: AnimatedBoard, center: paper.Point, id) {
    await animatedBoard.fold(
        id,
        FoldSpec.fromEndPoints(
            new paper.Point(center.x, center.y + 1),
            new paper.Point(center.x, center.y - 1)
        ),
        FOLD_TYPE.Create
    )
    let secondFolds = []

    for (let [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
    ]) {
        secondFolds.push(
            animatedBoard.fold(
                id,
                FoldSpec.fromEndPoints(
                    new paper.Point(center.x, center.y),
                    new paper.Point(center.x + dx, center.y + dy)
                ),
                FOLD_TYPE.Expand
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
            animatedBoard.fold(
                id,
                FoldSpec.fromEndPoints(
                    new paper.Point(center.x, center.y),
                    new paper.Point(center.x + dx, center.y + dy)
                ),
                FOLD_TYPE.Expand
            )
        )
    }

    await Promise.all(thirdFolds)
}

export function flower() {
    let bounds = new paper.Rectangle(0, 0, 4, 4)
    let { container, animatedBoard } = rigamarole({ bounds, zoom: 100 })

    makeFlower(animatedBoard, new paper.Point(2, 2), 1)

    return container
}

export function fourFlowers() {
    let bounds = new paper.Rectangle(0, 0, 9, 9)
    let { container, animatedBoard } = rigamarole({ bounds, zoom: 45 })
    let id = 1
    for (let center of [
        new paper.Point(2, 2),
        new paper.Point(2, 7),
        new paper.Point(7, 2),
        new paper.Point(7, 7)
    ]) {
        makeFlower(animatedBoard, center, id++)
    }

    return container
}
