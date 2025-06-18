import paper from "paper"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs, type CommonStoryArgs } from "./lib/common-args"
import { hasHoles, hasVertexContacts } from "@/lib/contacts"

export default {
    title: "Boolean Operations"
}

function shapeEvaluationText(annotationsLayer: paper.Layer, shape: paper.Path, point: paper.Point) {
    let text = `Holes: ${hasHoles(shape)}`
    text += `\nSelf-intersects: ${hasVertexContacts(shape)}`
    let pointText = new paper.PointText({
        content: text,
        point: point,
        fillColor: new paper.Color("#333")
    })
    pointText.fontSize = 0.4
    let textBackground = new paper.Path.Rectangle(
        new paper.Rectangle(
            pointText.bounds.x - 0.1,
            pointText.bounds.y - 0.1,
            pointText.bounds.width + 0.2,
            pointText.bounds.height + 0.2
        )
    )
    textBackground.fillColor = new paper.Color(1, 1, 1, 0.8)
    textBackground.strokeColor = new paper.Color("#333")
    textBackground.strokeWidth = 0.03
    annotationsLayer.addChild(textBackground)
    annotationsLayer.addChild(pointText)
}

export const contactUnion = withCommonArgs(function contactUnion(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 8, 5)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })

    let shape1 = board.addShape(
        1,
        new paper.Path([
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 1),
            new paper.Point(0, 1)
        ])
    )
    shape1.fillColor = new paper.Color(0.8, 0.2, 0.2)

    let shape2 = board.addShape(
        2,
        new paper.Path([
            new paper.Point(1, 0),
            new paper.Point(2, 0),
            new paper.Point(2, 1),
            new paper.Point(1, 1)
        ])
    )
    shape2.fillColor = new paper.Color(0.2, 0.2, 0.8)

    let union = shape1.unite(shape2) as paper.Path
    union.fillColor = new paper.Color(0.5, 0.5, 0.5)

    union.translate(new paper.Point(0, 2))
    board.addShape(3, union)

    shapeEvaluationText(annotationsLayer, union, union.bounds.topRight.add(new paper.Point(0.5, 0)))

    return container
})

export const overlapClosingUnion = withCommonArgs(function overlapClosingUnion(
    args: CommonStoryArgs
) {
    let bounds = new paper.Rectangle(-1, -1, 9, 9)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })

    let shape1 = board.addShape(
        1,
        new paper.Path([
            new paper.Point(0, 0),
            new paper.Point(3, 0),
            new paper.Point(1, 2),
            new paper.Point(3, 2),
            new paper.Point(3, 3),
            new paper.Point(0, 3)
        ])
    )
    shape1.fillColor = new paper.Color(0.8, 0.2, 0.2)

    let shape2 = board.addShape(
        2,
        new paper.Path([new paper.Point(0, 0), new paper.Point(3, 0), new paper.Point(3, 3)])
    )
    shape2.fillColor = new paper.Color(0.2, 0.2, 0.8)

    let union = shape1.unite(shape2) as paper.Path
    union.fillColor = new paper.Color(0.5, 0.5, 0.5)

    union.translate(new paper.Point(0, 4))
    union.flatten(0.01)
    board.addShape(3, union)

    shapeEvaluationText(annotationsLayer, union, union.bounds.topRight.add(new paper.Point(0.5, 0)))

    return container
})

export const tipsClosingUnion = withCommonArgs(function tipsClosingUnion(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-1, -1, 8, 9)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })

    let shape1 = board.addShape(
        1,
        new paper.Path([
            new paper.Point(0, 0),
            new paper.Point(2, 0),
            new paper.Point(1, 1),
            new paper.Point(2, 1),
            new paper.Point(0, 3),
            new paper.Point(0, 0)
        ])
    )
    shape1.fillColor = new paper.Color(0.8, 0.2, 0.2)

    let shape2 = board.addShape(
        2,
        new paper.Path([new paper.Point(2, 0), new paper.Point(2, 1), new paper.Point(1.5, 0.5)])
    )
    shape2.fillColor = new paper.Color(0.2, 0.2, 0.8)

    let union = shape1.unite(shape2) as paper.Path
    union.fillColor = new paper.Color(0.5, 0.5, 0.5)

    union.translate(new paper.Point(0, 4))
    union.flatten(0.01)
    board.addShape(3, union)

    shapeEvaluationText(annotationsLayer, union, union.bounds.topRight.add(new paper.Point(0.5, 0)))

    return container
})
