import type { Board } from "@/board"
import { FOLD_ACTION, type FoldAction, type FoldSpec, type Side } from "./fold-spec"

export function hasHoles(shape: paper.Path) {
    // Check if the shape has any holes
    return !(typeof shape.children === "undefined") && shape.children.length > 0
}

export function hasVertexContacts(shape: paper.Path) {
    // Check if the shape has self-intersections
    return shape.intersects(shape)
}

function isFullyContained(triangle: paper.Path, shape: paper.Path) {
    let intersection = triangle.intersect(shape, { insert: false })
    return Math.abs((intersection as paper.Path).area - triangle.area) < 0.01
}

function shapesHaveContact(shapeA: paper.Path, shapeB: paper.Path) {
    return (
        shapeA.intersects(shapeB) ||
        shapeA.contains(shapeB.segments[0].point) ||
        shapeB.contains(shapeA.segments[0].point)
    )
}

// const CONTACT_CHECK_TYPE = {
//     NotFullyContained: "NotFullyContained",
//     ChangesTopology: "ChangesTopology",
//     // SelfIntersection: "SelfIntersection",
// }

// type ContactCheck = {
//     side: Side,
//     type:
// }

export function verificationAllOk(verification: any): boolean {
    for (let checks of Object.values(verification)) {
        if (!Object.values(checks as any).every(value => value)) {
            return false
        }
    }
    return true
}

export function verifyFold(
    board: Board,
    bounds: paper.Rectangle,
    fold: FoldSpec,
    action: FoldAction,
    shapeId?: number
) {
    let { near, far } = fold.toTriangles()
    let shape: paper.Path | null = null
    if (action != FOLD_ACTION.Create) {
        if (shapeId === undefined) {
            throw new Error(
                `Shape ID must be provided for actions other than ${FOLD_ACTION.Create}`
            )
        }
        let retrievedShape = board.shapes.get(shapeId)
        if (!retrievedShape) {
            throw new Error(`Shape with id ${shapeId} not found`)
        }
        shape = retrievedShape
    }

    if (action == FOLD_ACTION.Expand) {
        let farUnion = shape!.unite(far, { insert: false }) as paper.Path
        let farIntersection = shape!.intersect(far, { insert: false }) as paper.Path
        let otherShapes = Array.from(board.shapes.entries())
            .filter(([id, _]) => id !== shapeId)
            .map(([_, otherShape]) => otherShape)
        let clearOfOtherShapes = true
        for (let otherShape of otherShapes) {
            if (shapesHaveContact(far, otherShape)) {
                clearOfOtherShapes = false
                break
            }
        }
        let innerLockShapes: paper.Path[] = []
        for (let lockShape of board.lockShapes.children) {
            if (lockShape.data.id === shapeId) {
                innerLockShapes.push(lockShape as paper.Path)
            }
        }
        let nearIntersectsLockShape = false
        for (let lockShape of innerLockShapes) {
            let intersection = near.intersect(lockShape as paper.Path, {
                insert: false
            }) as paper.Path
            if (Math.abs(intersection.area) > 0.01) {
                nearIntersectsLockShape = true
                break
            }
        }
        let outerIntersectsLockShapes = false
        for (let lockShape of board.lockShapes.children) {
            if (shapesHaveContact(far, lockShape as paper.Path)) {
                outerIntersectsLockShapes = true
                break
            }
        }
        return {
            near: {
                fullyContained: isFullyContained(near, shape!),
                clearOfLocks: !nearIntersectsLockShape
            },
            far: {
                noPerimeterContact: !hasVertexContacts(farUnion),
                noAreaOverlap: Math.abs(farIntersection.area) < 0.01,
                clearOfShapes: clearOfOtherShapes,
                clearOfLocks: !outerIntersectsLockShapes,
                inBounds: bounds.contains(far.bounds)
            }
        }
    } else if (action == FOLD_ACTION.Create) {
        function clearOfLocks(triangle: paper.Path) {
            for (let lockShape of board.lockShapes.children) {
                if (shapesHaveContact(triangle, lockShape as paper.Path)) {
                    return false
                }
            }
            return true
        }
        function clearOfShapes(triangle: paper.Path) {
            for (let otherShape of board.shapes.values()) {
                if (shapesHaveContact(triangle, otherShape)) {
                    return false
                }
            }
            return true
        }
        return {
            near: {
                clearOfLocks: clearOfLocks(near),
                clearOfShapes: clearOfShapes(near),
                inBounds: bounds.contains(near.bounds)
            },
            far: {
                clearOfLocks: clearOfLocks(far),
                clearOfShapes: clearOfShapes(far),
                inBounds: bounds.contains(far.bounds)
            }
        }
    } else {
        throw new Error(`Unsupported fold action: ${action}`)
    }
}
