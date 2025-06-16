import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { rigamarole } from "./rigamarole"
import { sleep } from "@/lib/time"
import { getSegmentAngle } from "@/lib/vec"
import { roundToHalfIntegers } from "@/lib/tetrakis"
import { withCommonArgs, type CommonStoryArgs } from "./common-args"

export default {
    title: "Checks"
}

export const latticeTrianglesAndPoints = withCommonArgs(function latticeTrianglesAndPoints(
    args: CommonStoryArgs
) {
    let bounds = new paper.Rectangle(0, 0, 5, 5)
    let { container, board } = rigamarole({
        bounds,
        zoom: 70,
        ...args
    })
    async function animate() {
        await sleep(300)
        await board.foldAsync(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 1), new paper.Point(3, 3)),
            FOLD_ACTION.Create
        )
    }
    animate()

    return container
})

export const wedges = withCommonArgs(function wedges(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-2, -2, 7, 7)
    let { container, board } = rigamarole({
        bounds,
        zoom: 40,
        ...args
    })
    async function animate() {
        await sleep(300)
        board.foldInstantaneously(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1), FOLD_COVER.Left),
            FOLD_ACTION.Create
        )
        board.foldInstantaneously(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2, 0), FOLD_COVER.Right),
            FOLD_ACTION.Expand
        )
        board.foldInstantaneously(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 0), new paper.Point(2, 1), FOLD_COVER.Full),
            FOLD_ACTION.Expand
        )
        board.foldInstantaneously(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 0), new paper.Point(1, 2), FOLD_COVER.Left),
            FOLD_ACTION.Expand
        )
        for (let i = 0; i < 50; i++) {
            let shape = board.shapes.get(1)!
            let first90Index = shape.segments.findIndex(
                (segment, _) => getSegmentAngle(segment) == 90
            )
            let first45Index = shape.segments.findIndex(
                (segment, _) => getSegmentAngle(segment) == 45
            )
            if (first90Index != -1) {
                let first90Segment = shape.segments[first90Index]
                let towardsPrev = first90Segment.previous.point.subtract(first90Segment.point)
                let towardsNext = first90Segment.next.point.subtract(first90Segment.point)
                let attemptLength = Math.min(towardsPrev.length, towardsNext.length)
                let attemptVector = towardsPrev.normalize().multiply(attemptLength)
                let foldSpec = FoldSpec.fromEndPoints(
                    roundToHalfIntegers(first90Segment.point.add(attemptVector)),
                    roundToHalfIntegers(first90Segment.point.subtract(attemptVector)),
                    FOLD_COVER.Right
                )
                await board.foldAsync(1, foldSpec, FOLD_ACTION.Expand)
            } else if (first45Index != -1) {
                let first45Segment = shape.segments[first45Index]
                let towardsPrev = first45Segment.previous.point.subtract(first45Segment.point)
                let towardsNext = first45Segment.next.point.subtract(first45Segment.point)
                let attemptLength = Math.min(towardsPrev.length / Math.sqrt(2), towardsNext.length)
                let towardsNewHinge = towardsNext.normalize().multiply(attemptLength)
                let newHinge = first45Segment.point.add(towardsNewHinge)
                let attemptVector = towardsNewHinge.rotate(90, new paper.Point(0, 0))
                let foldSpec = FoldSpec.fromEndPoints(
                    roundToHalfIntegers(newHinge.add(attemptVector)),
                    roundToHalfIntegers(newHinge.subtract(attemptVector)),
                    FOLD_COVER.Left
                )
                await board.foldAsync(1, foldSpec, FOLD_ACTION.Expand)
            } else {
                console.warn("No 90 degree segment found, stopping animation.")
                break
            }
        }
    }
    animate()
    return container
})
