import paper from "paper"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold"
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
    let { container, animatedBoard } = rigamarole({
        bounds,
        zoom: 70,
        drawGridLines: args.drawGridLines,
        latticeAvailability: args.latticeAvailability,
        latticeContactid: args.latticeContactid,
        showShapeId: args.showShapeId
    })
    async function animate() {
        await sleep(300)
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 1), new paper.Point(3, 3)),
            FOLD_ACTION.Create
        )
    }
    animate()

    return container
})

export const fullCoverCandidates = withCommonArgs(function fullCoverCandidates(
    args: CommonStoryArgs
) {
    let bounds = new paper.Rectangle(0, 0, 5, 5)
    let { container, animatedBoard } = rigamarole({
        bounds,
        zoom: 70,
        drawGridLines: args.drawGridLines,
        latticeAvailability: args.latticeAvailability,
        latticeContactid: args.latticeContactid,
        showShapeId: args.showShapeId
    })
    async function animate() {
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 1), new paper.Point(3, 3), FOLD_COVER.Full),
            FOLD_ACTION.Create,
            true
        )
    }
    animate()

    return container
})

export const wedges = withCommonArgs(function wedges(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-2, -2, 7, 7)
    let { container, animatedBoard } = rigamarole({
        bounds,
        zoom: 40,
        drawGridLines: false, //, args.drawGridLines,
        latticeAvailability: args.latticeAvailability,
        latticeContactid: args.latticeContactid,
        speedFactor: 3,
        showShapeId: args.showShapeId
    })
    let vertexLabelsGroup = new paper.Group()
    function updateVertexLabels(shape: paper.Path) {
        vertexLabelsGroup.removeChildren()
        shape.segments.forEach((segment, index) => {
            let circle = new paper.Path.Circle({
                center: segment.point,
                // radius: 0.2,
                radius: 0.15,
                fillColor: "white",
                strokeColor: "black",
                strokeWidth: 0.02
            })
            vertexLabelsGroup.addChild(circle)
            let label = new paper.PointText({
                // content: discretizeAngle(
                //     angleBetweenVectors(
                //         shape.segments[index].next.point.subtract(segment.point),
                //         shape.segments[index].previous.point.subtract(segment.point)
                //     )
                // ),
                content: index,
                point: segment.point.add(new paper.Point(0, 0.05)),
                fillColor: "black",
                fontSize: 0.2,
                justification: "center"
            })
            vertexLabelsGroup.addChild(label)
        })
    }
    animatedBoard.addShapeUpdateListener(() => {
        updateVertexLabels(animatedBoard.shapes.get(1)!)
    })
    async function animate() {
        await sleep(300)
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(1, 1), FOLD_COVER.Left),
            FOLD_ACTION.Create,
            true
        )
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2, 0), FOLD_COVER.Right),
            FOLD_ACTION.Expand,
            true
        )
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 0), new paper.Point(2, 1), FOLD_COVER.Full),
            FOLD_ACTION.Expand,
            true
        )
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 0), new paper.Point(1, 2), FOLD_COVER.Left),
            FOLD_ACTION.Expand,
            true
        )
        for (let i = 0; i < 50; i++) {
            let shape = animatedBoard.shapes.get(1)!
            let first90Index = shape.segments.findIndex(
                (segment, _) => getSegmentAngle(segment) == 90
            )
            let first45Index = shape.segments.findIndex(
                (segment, _) => getSegmentAngle(segment) == 45
            )
            if (first90Index != -1) {
                console.log("First 90 segment found at index", first90Index)
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
                await animatedBoard.fold(1, foldSpec, FOLD_ACTION.Expand)
            } else if (first45Index != -1) {
                let first45Segment = shape.segments[first45Index]
                console.log("First 45 segment found at index", first45Index)
                let towardsPrev = first45Segment.previous.point.subtract(first45Segment.point)
                let towardsNext = first45Segment.next.point.subtract(first45Segment.point)
                // the line to prev will be the hypothenuse
                // and we will be comparing it with the adjacent side
                // which is only going to be 1/ sqrt(2) of the hypothenuse
                let attemptLength = Math.min(towardsPrev.length / Math.sqrt(2), towardsNext.length)
                let towardsNewHinge = towardsNext.normalize().multiply(attemptLength)
                let newHinge = first45Segment.point.add(towardsNewHinge)
                let attemptVector = towardsNewHinge.rotate(90, new paper.Point(0, 0))
                let foldSpec = FoldSpec.fromEndPoints(
                    roundToHalfIntegers(newHinge.add(attemptVector)),
                    roundToHalfIntegers(newHinge.subtract(attemptVector)),
                    FOLD_COVER.Left
                )
                await animatedBoard.fold(1, foldSpec, FOLD_ACTION.Expand)
            } else {
                console.warn("No 90 degree segment found, stopping animation.")
                break
            }
        }
    }
    animate()
    return container
})
