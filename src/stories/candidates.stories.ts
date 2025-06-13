import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold"
import { rigamarole } from "./rigamarole"
import { sleep } from "@/lib/time"
import { getSegmentAngle } from "@/lib/vec"
import { roundToHalfIntegers } from "@/lib/tetrakis"
import { withCommonArgs, type CommonStoryArgs } from "./common-args"

export default {
    title: "Candidates"
}

export const fullCover = withCommonArgs(function fullCover(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(0, 0, 2, 2)
    let { container, board } = rigamarole({
        bounds,
        zoom: 70,
        ...args
    })

    board.foldInstantaneously(
        1,
        FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2, 2)),
        FOLD_ACTION.Create
    )

    async function animate() {
        await board.foldAsync(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1)),
            FOLD_ACTION.Contract
        )
    }
    animate()

    return container
})
