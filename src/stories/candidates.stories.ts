import paper from "paper"
import { FoldSpec } from "@/lib/fold-spec"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs, type CommonStoryArgs } from "./lib/common-args"
import { FoldSpecBasis } from "@/lib/fold-spec-basis"

export default {
    title: "Candidates"
}

function MOAP() {
    return new paper.Path(
        [
            [3, 0],
            [6, 0],
            [9, 3],
            [7, 5],
            [6, 5],
            [5, 4],
            [2, 7],
            [0, 7],
            [0, 6],
            [1, 5],
            [1, 2]
        ].map(p => new paper.Point(p[0], p[1]))
    )
}

function drawArrow(layer: paper.Layer, origin: paper.Point, vector: paper.Point) {
    let arrowStart = new paper.Shape.Circle(origin, 0.05)
    arrowStart.fillColor = new paper.Color("green")
    layer.addChild(arrowStart)
    let endPoint = origin.add(vector)
    let hingeBasisArrow = new paper.Path([origin, endPoint])
    hingeBasisArrow.strokeColor = new paper.Color("green")
    hingeBasisArrow.strokeWidth = 0.04
    layer.addChild(hingeBasisArrow)
    let arrowHeadLength = 0.2
    let arrowHead = new paper.Path([
        endPoint.subtract(vector.rotate(30, new paper.Point(0, 0)).normalize(arrowHeadLength)),
        endPoint,
        endPoint.subtract(vector.rotate(-30, new paper.Point(0, 0)).normalize(arrowHeadLength))
    ])
    arrowHead.strokeColor = new paper.Color("green")
    arrowHead.strokeWidth = 0.04
    layer.addChild(arrowHead)
}

function annotateFold(layer: paper.Layer, foldSpec: FoldSpec) {
    let innerWedge = new paper.Path([foldSpec.hinges[0], foldSpec.start, foldSpec.hinges[1]])
    innerWedge.strokeColor = new paper.Color("#c6c30b")
    innerWedge.strokeWidth = 0.05
    layer.addChild(innerWedge)
    let outerWedge = new paper.Path([foldSpec.hinges[1], foldSpec.end, foldSpec.hinges[0]])
    outerWedge.strokeColor = new paper.Color("#7fc60b")
    outerWedge.strokeWidth = 0.05
    layer.addChild(outerWedge)
}

function renderCandidatesStory(
    args: CommonStoryArgs,
    bounds: paper.Rectangle,
    fullCover: boolean,
    yOffset: number
) {
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })

    let baseShape = MOAP()

    for (const isSecond of [false, true]) {
        let shape = isSecond ? baseShape.clone() : baseShape
        if (isSecond) {
            shape.translate(new paper.Point(0, yOffset))
        }
        shape = board.addShape(isSecond ? 2 : 1, shape)
        let handedness = !isSecond // true for first (cw), false for second (ccw)
        let foldBases = FoldSpecBasis.getAllExpansions(shape, handedness, fullCover)
        for (let foldBase of foldBases) {
            drawArrow(annotationsLayer, foldBase.start, foldBase.basis)
            let foldSpecs = foldBase.getAll()
            for (let foldSpec of foldSpecs) {
                annotateFold(annotationsLayer, foldSpec)
            }
        }
    }

    return container
}

export const fullCoverExpansions = withCommonArgs(function fullCoverExpansions(
    args: CommonStoryArgs
) {
    return renderCandidatesStory(args, new paper.Rectangle(-1, -2, 11, 20), true, 9)
})

export const partialCoverExpansion = withCommonArgs(function partialCoverExpansion(
    args: CommonStoryArgs
) {
    return renderCandidatesStory(args, new paper.Rectangle(-3, -4, 15, 26), false, 12)
})

export const fullCoverContractions = withCommonArgs(function fullCoverContractions(
    args: CommonStoryArgs
) {
    let bounds = new paper.Rectangle(-1, -2, 11, 20)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })
    let shape = board.addShape(1, MOAP())
    let contractionBases = FoldSpecBasis.getAllFullCoverContractions(shape)
    for (let foldBase of contractionBases) {
        drawArrow(annotationsLayer, foldBase.start, foldBase.basis)
        let foldSpecs = foldBase.getAll()
        for (let foldSpec of foldSpecs) {
            annotateFold(annotationsLayer, foldSpec)
        }
    }
    return container
})
