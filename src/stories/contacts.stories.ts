import paper from "paper"
import { rigamarole } from "./rigamarole"
import { withCommonArgs, type CommonStoryArgs } from "./common-args"
import { FOLD_ACTION, FOLD_COVER, FoldSpec } from "@/lib/fold-spec"
import { visualiseFoldSpec } from "./visualize-fold"
import { verificationAllOk, verifyFold } from "@/lib/contacts"

export default {
    title: "Contacts"
}

function addTextBox(layer: paper.Layer, text: string, topLeft: paper.Point) {
    let group = new paper.Group()
    let pointText = new paper.PointText({
        content: text,
        fillColor: new paper.Color("#333")
    })
    pointText.fontSize = 0.35
    pointText.translate(new paper.Point(-pointText.bounds.left, -pointText.bounds.top))
    let textBackground = new paper.Path.Rectangle(
        new paper.Rectangle(
            pointText.bounds.x - 0.1,
            pointText.bounds.y - 0.1,
            pointText.bounds.width + 0.2,
            pointText.bounds.height + 0.2
        )
    )
    textBackground.fillColor = new paper.Color(1, 1, 1)
    textBackground.strokeColor = new paper.Color("#333")
    textBackground.strokeWidth = 0.03
    layer.addChild(textBackground)
    layer.addChild(pointText)
    group.addChild(textBackground)
    group.addChild(pointText)

    group.translate(topLeft)
    return group
}

export const expandInnerFold = withCommonArgs(function expandInnerFold(args: CommonStoryArgs) {
    let bounds = new paper.Rectangle(-2, -1, 12, 70)
    let { container, board, annotationsLayer } = rigamarole({
        bounds,
        zoom: 50,
        ...args
    })

    let id = 1
    const shapes = [
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 1),
                new paper.Point(0, 1)
            ],
            fillColor: "#ffb6c1",
            foldStart: new paper.Point(0.5, 0.5),
            foldEnd: new paper.Point(1.5, 0.5),
            offset: new paper.Point(0, 0),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(2, 0),
                new paper.Point(2, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#90ee90",
            foldStart: new paper.Point(0, 2),
            foldEnd: new paper.Point(4, 2),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Left,
            lockShapes: [[new paper.Point(0, 0), new paper.Point(2, 2), new paper.Point(0, 2)]]
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#add8e6",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 3),
                new paper.Point(0, 3)
            ],
            fillColor: "#d8bff8",
            foldStart: new paper.Point(-0.5, 1.5),
            foldEnd: new paper.Point(2.5, 1.5),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(2, 1),
                new paper.Point(2, 3),
                new paper.Point(0, 3)
            ],
            fillColor: "#bfe0ff",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 4),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(-1, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 3),
                new paper.Point(2, 2),
                new paper.Point(2, 0),
                new paper.Point(3, 0),
                new paper.Point(3, 4),
                new paper.Point(-1, 4)
            ],
            fillColor: "#ffe4b5",
            foldStart: new paper.Point(-0.5, 1.5),
            foldEnd: new paper.Point(2.5, 1.5),
            offset: new paper.Point(0, 4),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(2, 2),
                new paper.Point(2, 1),
                new paper.Point(3, 2),
                new paper.Point(3, 3),
                new paper.Point(0, 3)
            ],
            fillColor: "#ddccdd",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 5),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(2, 2),
                new paper.Point(2, 0),
                new paper.Point(3, 1),
                new paper.Point(3, 3),
                new paper.Point(0, 3)
            ],
            fillColor: "#ffcc99",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 4),
            cover: FOLD_COVER.Full
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#ffb6c1",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 4),
            cover: FOLD_COVER.Full,
            otherShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 2),
                    new paper.Point(3, 2),
                    new paper.Point(2.5, 2.5)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#ffb6c1",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full,
            otherShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 1),
                    new paper.Point(3, 1),
                    new paper.Point(2.5, 1.5)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(-1, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 4),
                new paper.Point(-1, 4)
            ],
            fillColor: "#99ccff",
            foldStart: new paper.Point(-1, 2),
            foldEnd: new paper.Point(3, 2),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full,
            otherShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 1),
                    new paper.Point(3, 1),
                    new paper.Point(3, 3),
                    new paper.Point(2, 3)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(-2, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 5),
                new paper.Point(-2, 5)
            ],
            fillColor: "#99ccff",
            foldStart: new paper.Point(-1.5, 2.5),
            foldEnd: new paper.Point(3.5, 2.5),
            offset: new paper.Point(0, 5),
            cover: FOLD_COVER.Full,
            otherShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 2),
                    new paper.Point(2.5, 2.5),
                    new paper.Point(2, 3)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#ffb6c1",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 6),
            cover: FOLD_COVER.Full,
            otherLockShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 2),
                    new paper.Point(3, 2),
                    new paper.Point(2.5, 2.5)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 2),
                new paper.Point(0, 2)
            ],
            fillColor: "#ffb6c1",
            foldStart: new paper.Point(0, 1),
            foldEnd: new paper.Point(2, 1),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full,
            otherLockShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 1),
                    new paper.Point(3, 1),
                    new paper.Point(2.5, 1.5)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(-1, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 4),
                new paper.Point(-1, 4)
            ],
            fillColor: "#99ccff",
            foldStart: new paper.Point(-1, 2),
            foldEnd: new paper.Point(3, 2),
            offset: new paper.Point(0, 3),
            cover: FOLD_COVER.Full,
            otherLockShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 1),
                    new paper.Point(3, 1),
                    new paper.Point(3, 3),
                    new paper.Point(2, 3)
                ]
            }
        },
        {
            id: id++,
            points: [
                new paper.Point(-2, 0),
                new paper.Point(1, 0),
                new paper.Point(1, 5),
                new paper.Point(-2, 5)
            ],
            fillColor: "#99ccff",
            foldStart: new paper.Point(-1.5, 2.5),
            foldEnd: new paper.Point(3.5, 2.5),
            offset: new paper.Point(0, 5),
            cover: FOLD_COVER.Full,
            otherLockShapes: {
                [-(id - 1)]: [
                    new paper.Point(2, 2),
                    new paper.Point(2.5, 2.5),
                    new paper.Point(2, 3)
                ]
            }
        }
    ]

    let currentOffset = new paper.Point(0, 0)
    shapes.forEach(
        ({
            id,
            points,
            fillColor,
            foldStart,
            foldEnd,
            offset,
            cover,
            lockShapes,
            otherShapes,
            otherLockShapes
        }) => {
            currentOffset = currentOffset.add(offset)
            let path = new paper.Path(points)
            path.translate(currentOffset)
            let shape = board.addShape(id, path)
            shape.fillColor = new paper.Color(fillColor)
            let fold = FoldSpec.fromEndPoints(
                foldStart.add(currentOffset),
                foldEnd.add(currentOffset),
                cover
            )
            if (lockShapes) {
                for (let path of lockShapes) {
                    let region = new paper.Path(path)
                    region.closed = true
                    region.translate(currentOffset)
                    region.fillColor = new paper.Color("#ffff00aa")
                    region.strokeColor = new paper.Color("#ffff00")
                    region.strokeWidth = 0.05
                    region.data = { id: id }
                    board.lockShapes.addChild(region)
                }
            }
            if (otherShapes) {
                for (let [shapeId, points] of Object.entries(otherShapes)) {
                    let path = new paper.Path(points)
                    path.translate(currentOffset)
                    board.addShape(Number(shapeId), path)
                }
            }
            if (otherLockShapes) {
                for (let [lockId, path] of Object.entries(otherLockShapes)) {
                    let region = new paper.Path(path)
                    region.closed = true
                    region.translate(currentOffset)
                    region.fillColor = new paper.Color("#ffff00aa")
                    region.strokeColor = new paper.Color("#ffff00")
                    region.strokeWidth = 0.05
                    region.data = { id: lockId }
                    board.lockShapes.addChild(region)
                }
            }
            visualiseFoldSpec(annotationsLayer, fold, FOLD_ACTION.Expand)
            let verification = verifyFold(board, bounds, fold, FOLD_ACTION.Expand, shape.data.id)
            const formatted = Object.entries(verification as any)
                .map(([k, v]) =>
                    Object.entries(v as Record<string, unknown>)
                        .map(([kk, vv]) => `${k}.${kk}: ${String(vv)}`)
                        .join("\n")
                )
                .join("\n")
            addTextBox(annotationsLayer, formatted, new paper.Point(4, 0).add(currentOffset))
            let circle = new paper.Path.Circle(new paper.Point(3.7, 0.11).add(currentOffset), 0.1)
            circle.fillColor = verificationAllOk(verification)
                ? new paper.Color("#00ff00")
                : new paper.Color("#ff0000")
        }
    )

    return container
})
