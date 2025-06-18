import paper from "paper"
import type { Board } from "@/board"
import { FOLD_ACTION, FOLD_COVER, FoldSpec, type FoldCover } from "@/lib/fold-spec"
import { visualiseFoldSpec } from "@/stories/lib/visualize-fold"

export type Specimen = {
    description: string
    expectedFailedChecks?: string[]
    points: paper.Point[]
    foldStart: paper.Point
    foldEnd: paper.Point
    cover: FoldCover
    selfLock?: paper.Point[]
    otherShape?: paper.Point[]
    otherLock?: paper.Point[]
}

export function applySpecimen(
    board: Board,
    specimen: Specimen
): {
    bounds: paper.Rectangle
    annotations: paper.Group
    foldSpec: FoldSpec
} {
    let { points, foldStart, foldEnd, cover, selfLock, otherShape, otherLock } = specimen
    let shape = board.addShape(1, new paper.Path({ insert: false, segments: points }))
    let bounds = shape.bounds
    let annotations = new paper.Group({ insert: false })
    if (selfLock) {
        let lockPath = new paper.Path({ insert: false, segments: selfLock })
        lockPath.closed = true
        lockPath.data = { id: 1 }
        board.lockShapes.addChild(lockPath)
        bounds = bounds.unite(lockPath.bounds)
        let lockPathAnnotation = lockPath.clone()
        lockPathAnnotation.fillColor = new paper.Color("#ffff00aa")
        lockPathAnnotation.strokeColor = new paper.Color("#ffff00")
        lockPathAnnotation.strokeWidth = 0.05
        annotations.addChild(lockPathAnnotation)
    }
    if (otherShape) {
        let shape = board.addShape(2, new paper.Path({ insert: false, segments: otherShape }))
        bounds = bounds.unite(shape.bounds)
    }
    if (otherLock) {
        let lockPath = new paper.Path({ insert: false, segments: otherLock })
        lockPath.closed = true
        lockPath.data = { id: 3 }
        bounds = bounds.unite(lockPath.bounds)
        board.lockShapes.addChild(lockPath)
        let lockPathAnnotation = lockPath.clone()
        lockPathAnnotation.fillColor = new paper.Color("#ffff00aa")
        lockPathAnnotation.strokeColor = new paper.Color("#ffff00")
        lockPathAnnotation.strokeWidth = 0.05
        annotations.addChild(lockPathAnnotation)
    }
    let foldSpec = FoldSpec.fromEndPoints(foldStart, foldEnd, cover)
    annotations.addChild(visualiseFoldSpec(foldSpec, FOLD_ACTION.Expand))
    bounds = bounds.unite(foldSpec.toQuad().bounds)
    return { bounds, annotations, foldSpec }
}
export const expandFoldSpecimens: Specimen[] = [
    {
        description: "inner fold fully contained with paddding",
        expectedFailedChecks: [],
        points: [
            new paper.Point(-1, -1),
            new paper.Point(1, -1),
            new paper.Point(1, 3),
            new paper.Point(-1, 3)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full
    },
    {
        description: "inner fold fully contained snugly",
        expectedFailedChecks: [],
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(0, 2)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full
    },
    {
        description: "inner fold stuck on a lock",
        expectedFailedChecks: ["near.clearOfLocks"],
        points: [
            new paper.Point(-1, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(-1, 2)
        ],
        foldStart: new paper.Point(-1, 2),
        foldEnd: new paper.Point(3, 2),
        cover: FOLD_COVER.Left,
        selfLock: [new paper.Point(-1, 0), new paper.Point(1, 2), new paper.Point(-1, 2)]
    },
    {
        description: "inner fold sticking out of the shape",
        expectedFailedChecks: ["near.fullyContained"],
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 4),
            new paper.Point(0, 4)
        ],
        foldStart: new paper.Point(-1, 2),
        foldEnd: new paper.Point(3, 2),
        cover: FOLD_COVER.Full
    },
    {
        description: "outer fold snugly clear of self",
        expectedFailedChecks: [],
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(2, 1),
            new paper.Point(2, 3),
            new paper.Point(0, 3)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full
    },
    {
        description: "outer fold self-collision with overlap",
        expectedFailedChecks: ["far.noSelfCollision"],
        points: [
            new paper.Point(-1, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 4),
            new paper.Point(2, 3),
            new paper.Point(2, 0),
            new paper.Point(3, 0),
            new paper.Point(3, 5),
            new paper.Point(-1, 5)
        ],
        foldStart: new paper.Point(-1, 2),
        foldEnd: new paper.Point(3, 2),
        cover: FOLD_COVER.Full
    },
    {
        description: "outer fold self-collision in one point",
        expectedFailedChecks: ["far.noSelfCollision"],
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
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full
    },
    {
        description: "outer fold self-collision along an edge",
        expectedFailedChecks: ["far.noSelfCollision"],
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
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full
    },
    {
        description: "outer fold clear of other shape",
        expectedFailedChecks: [],
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(0, 2)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full,
        otherShape: [new paper.Point(2, 2), new paper.Point(3, 2), new paper.Point(3, 3)]
    },
    {
        description: "outer fold collision with other shape in one point",
        expectedFailedChecks: ["far.clearOfShapes"],
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(0, 2)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full,
        otherShape: [new paper.Point(2, 1), new paper.Point(3, 1), new paper.Point(3, 2)]
    },
    {
        description: "outer fold collision with other shape with overlap",
        expectedFailedChecks: ["far.clearOfShapes"],
        points: [
            new paper.Point(-1, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 4),
            new paper.Point(-1, 4)
        ],
        foldStart: new paper.Point(-1, 2),
        foldEnd: new paper.Point(3, 2),
        cover: FOLD_COVER.Full,
        otherShape: [
            new paper.Point(2, 1),
            new paper.Point(3, 1),
            new paper.Point(3, 3),
            new paper.Point(2, 3)
        ]
    },
    {
        description: "outer fold clear of other shape lock",
        points: [
            new paper.Point(0, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 2),
            new paper.Point(0, 2)
        ],
        foldStart: new paper.Point(0, 1),
        foldEnd: new paper.Point(2, 1),
        cover: FOLD_COVER.Full,
        otherLock: [new paper.Point(2, 2), new paper.Point(3, 2), new paper.Point(3, 3)]
    },
    {
        description: "outer fold collision with lock with overlap",
        expectedFailedChecks: ["far.clearOfLocks"],
        points: [
            new paper.Point(-1, 0),
            new paper.Point(1, 0),
            new paper.Point(1, 4),
            new paper.Point(-1, 4)
        ],
        foldStart: new paper.Point(-1, 2),
        foldEnd: new paper.Point(3, 2),
        cover: FOLD_COVER.Full,
        otherLock: [
            new paper.Point(2, 1),
            new paper.Point(3, 1),
            new paper.Point(3, 3),
            new paper.Point(2, 3)
        ]
    },
    {
        description: "outer fold surriounding a lock",
        expectedFailedChecks: ["far.clearOfLocks"],
        points: [
            new paper.Point(-4, 0),
            new paper.Point(0, 0),
            new paper.Point(0, 6),
            new paper.Point(-4, 6)
        ],
        foldStart: new paper.Point(-3, 3),
        foldEnd: new paper.Point(3, 3),
        cover: FOLD_COVER.Full,
        otherLock: [new paper.Point(1, 3), new paper.Point(2, 3), new paper.Point(1, 4)]
    }
]
