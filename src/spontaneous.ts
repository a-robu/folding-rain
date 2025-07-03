import paper from "paper"
import type PRNG from "random-seedable/@types/PRNG"
import { Board } from "./board"
import { verificationAllOk, verifyFold } from "@/lib/contacts"
import { FoldSpec, FOLD_ACTION, FOLD_COVERS, FOLD_COVER, type FoldAction } from "@/lib/fold-spec"
import { FoldSpecBasis } from "@/lib/fold-spec-basis"
import { allVertices, squareDiagonalRays, roundToGrid, isOnGrid, expandBounds } from "@/lib/grid"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { XORShift } from "random-seedable"
import { exponentialDelay, sleep } from "@/lib/time"
import { getSegmentAngle } from "@/lib/vec"
import { randomGridPolygon } from "./random-grid-polygon"

export class ProceduralAnimation {
    private random: PRNG
    private board: Board
    private bounds: paper.Rectangle

    constructor(board: Board, bounds: paper.Rectangle, seed?: number) {
        // ensure mandatory arguments are provided
        if (!board || !(board instanceof Board)) {
            throw new Error("A valid Board instance is required.")
        }
        if (!bounds || !(bounds instanceof paper.Rectangle)) {
            throw new Error("A valid paper.Rectangle bounds is required.")
        }
        this.board = board
        this.bounds = expandBounds(bounds)
        this.random = new XORShift(seed)
    }

    setBounds(bounds: paper.Rectangle) {
        if (!bounds || !(bounds instanceof paper.Rectangle)) {
            throw new Error("A valid paper.Rectangle bounds is required.")
        }
        this.bounds = expandBounds(bounds)
    }

    private createSmallerBounds(maxSize: number): paper.Rectangle {
        // Generate a random position within the main bounds
        const maxWidth = Math.min(maxSize, this.bounds.width)
        const maxHeight = Math.min(maxSize, this.bounds.height)

        // Random width and height up to maxSize
        const width = this.random.randRange(Math.min(3, maxWidth), maxWidth)
        const height = this.random.randRange(Math.min(3, maxHeight), maxHeight)

        // Random position ensuring the smaller bounds fit within main bounds
        const maxLeft = this.bounds.right - width
        const maxTop = this.bounds.bottom - height
        const left = this.random.randRange(this.bounds.left, maxLeft)
        const top = this.random.randRange(this.bounds.top, maxTop)

        return new paper.Rectangle(left, top, width, height)
    }

    tryAddRandomShape(attempts = 3, maxSize = 10): void {
        // console.log(`🎲 tryAddRandomShape: Starting with ${attempts} attempts`)
        // console.log(`📏 Bounds:`, this.bounds)
        // console.log(`🏠 Current board shapes count:`, this.board.shapes.size)
        // console.log(`🔒 Current lock shapes count:`, this.board.lockShapes.children.length)

        // Log existing shapes
        if (this.board.shapes.size > 0) {
            // console.log(`🏠 Existing shapes:`)
            // for (let [id, shape] of this.board.shapes.entries()) {
            //     // console.log(`  Shape ${id}: ${shape.segments.length} segments, points:`,
            //     //     shape.segments.map(seg => `(${seg.point.x}, ${seg.point.y})`))
            // }
        }

        // Log lock shapes
        if (this.board.lockShapes.children.length > 0) {
            // console.log(`🔒 Lock shapes:`)
            // this.board.lockShapes.children.forEach((lock, index) => {
            //     const lockPath = lock as paper.Path
            //     // console.log(`  Lock ${index}: ${lockPath.segments.length} segments, points:`,
            //     //     lockPath.segments.map(seg => `(${seg.point.x}, ${seg.point.y})`))
            // })
        }

        for (let attempt = 0; attempt < attempts; attempt++) {
            // console.log(`\n🔄 Attempt ${attempt + 1}/${attempts}`)

            // Create smaller bounds for the random polygon, capped to maxSize
            const smallerBounds = this.createSmallerBounds(maxSize)

            // Generate a random polygon with smaller bounds
            const poly = randomGridPolygon(smallerBounds, this.random)
            // console.log(`📐 Generated polygon with ${poly.segments.length} segments`)
            // console.log(`📍 Polygon points:`, poly.segments.map(seg => `(${seg.point.x}, ${seg.point.y})`))

            // Check for grid alignment (all vertices integer)
            // const gridAlignedVertices = poly.segments.map(seg => ({
            //     point: seg.point,
            //     isOnGrid: isOnGrid(seg.point)
            // }))
            // console.log(`🎯 Grid alignment check:`, gridAlignedVertices)

            if (!poly.segments.every(seg => isOnGrid(seg.point))) {
                // console.log(`❌ Grid alignment failed - continuing to next attempt`)
                continue
            }
            // console.log(`✅ Grid alignment passed`)

            // Check for contact with existing shapes or locks
            // console.log(`🔍 Checking clearance with existing shapes...`)
            let clearOfShapes = true
            let shapeCollisionDetails = []

            for (let [shapeId, other] of this.board.shapes.entries()) {
                const intersects = poly.intersects(other) || other.intersects(poly)
                const polyContainsOther = poly.contains(other.segments[0].point)
                const otherContainsPoly = other.contains(poly.segments[0].point)

                shapeCollisionDetails.push({
                    shapeId,
                    intersects,
                    polyContainsOther,
                    otherContainsPoly,
                    hasCollision: intersects || polyContainsOther || otherContainsPoly
                })

                if (intersects || polyContainsOther || otherContainsPoly) {
                    clearOfShapes = false
                    // console.log(`💥 Shape collision detected with shape ${shapeId}:`, {
                    //     intersects,
                    //     polyContainsOther,
                    //     otherContainsPoly
                    // })
                    break
                }
            }

            // console.log(`🏠 Shape clearance details:`, shapeCollisionDetails)
            // console.log(`🏠 Clear of shapes:`, clearOfShapes)

            // console.log(`🔍 Checking clearance with lock shapes...`)
            let clearOfLocks = true
            let lockCollisionDetails = []

            for (let [lockIndex, lock] of this.board.lockShapes.children.entries()) {
                const lockPath = lock as paper.Path
                const intersects = poly.intersects(lockPath) || lockPath.intersects(poly)
                const polyContainsLock = poly.contains(lockPath.segments[0].point)
                const lockContainsPoly = lockPath.contains(poly.segments[0].point)

                lockCollisionDetails.push({
                    lockIndex,
                    intersects,
                    polyContainsLock,
                    lockContainsPoly,
                    hasCollision: intersects || polyContainsLock || lockContainsPoly
                })

                if (intersects || polyContainsLock || lockContainsPoly) {
                    clearOfLocks = false
                    // console.log(`🔒 Lock collision detected with lock ${lockIndex}:`, {
                    //     intersects,
                    //     polyContainsLock,
                    //     lockContainsPoly
                    // })
                    break
                }
            }

            // console.log(`🔒 Lock clearance details:`, lockCollisionDetails)
            // console.log(`🔒 Clear of locks:`, clearOfLocks)

            if (!clearOfShapes || !clearOfLocks) {
                // console.log(`❌ Clearance failed - continuing to next attempt`)
                continue
            }

            // console.log(`✅ All clearance checks passed!`)

            // Add the shape
            const unusedIndex =
                this.board.shapes.size === 0 ? 1 : Math.max(...this.board.shapes.keys()) + 1
            // console.log(`🎯 Adding shape with index:`, unusedIndex)

            this.board.addShape(unusedIndex, poly)
            // console.log(`🎉 Successfully added shape! New shapes count:`, this.board.shapes.size)
            return
        }

        // console.log(`😞 tryAddRandomShape: Failed to add shape after ${attempts} attempts`)
    }

    async rainContinuously() {
        // for (let i = 0; i < this.random.randRange(3, 10); i++) {
        //     tryCreate(this.board, this.bounds, this.random)
        //     // if (attempt) {
        //     //     await attempt
        //     // }
        // }
        while (true) {
            if (this.random.float() < this.bounds.area * 0.00001) {
                tryCreate(this.board, this.bounds, this.random)
            }
            if (this.random.float() < this.bounds.area * 0.0001) {
                tryRemoveSquare(this.board, this.random)
            }
            if (this.random.float() < this.bounds.area * 0.0001) {
                tryRemoveRightIsosceles(this.board, this.random)
            }
            // if (this.random.float() < 0.1) {
            //     let shapeId: number | null = null
            //     let foldSpec: FoldSpec | null = null
            //     shapeId = this.random.choice(Array.from(this.board.shapes.keys()))
            //     let shape = this.board.shapes.get(shapeId!)
            //     foldSpec = randomlyChooseContractionFold(shape!, this.random)
            //     if (foldSpec) {
            //         this.board.foldAsync(shapeId!, foldSpec, FOLD_ACTION.Contract)
            //     }
            // }
            if (this.board.shapes.size > 0 && this.random.float() < this.bounds.area * 0.0001) {
                let shapeId: number | null = null
                let foldSpec: FoldSpec | null = null
                shapeId = this.random.choice(Array.from(this.board.shapes.keys()))
                let shape = this.board.shapes.get(shapeId!)
                let foldAction: FoldAction
                if (this.random.float() < 0.6) {
                    foldSpec = randomlyChooseExpansionFold(shape!, this.random)
                    foldAction = FOLD_ACTION.Expand
                } else {
                    foldSpec = randomlyChooseContractionFold(shape!, this.random)
                    foldAction = FOLD_ACTION.Contract
                }

                if (foldSpec) {
                    this.board.foldAsync(shapeId!, foldSpec, foldAction)
                }
            }
            await sleep(exponentialDelay(50))
        }
    }
}

export function randomlyChooseExpansionFold(shape: paper.Path, random: PRNG): FoldSpec | null {
    let clockwise = random.bool()
    let fullCover = random.bool()
    let foldBases = FoldSpecBasis.getAllExpansions(shape, clockwise, fullCover)
    if (foldBases.length == 0) {
        return null
    }
    let basis = random.choice(foldBases) as FoldSpecBasis
    let maxMultiplier = randomChoiceWeighted(
        random,
        [1, 2, 3, 4, 5],
        normalise([100, 50, 25, 10, 5])
    )
    let foldSpec = basis.atMultiplier(basis.maxMultiplier(maxMultiplier))
    let verification = verifyFold(shape.data.board, foldSpec, FOLD_ACTION.Expand, shape.data.id)
    if (!verificationAllOk(verification)) {
        return null
    }
    return foldSpec
}

export function randomlyChooseContractionFold(shape: paper.Path, random: PRNG): FoldSpec | null {
    let foldBases = FoldSpecBasis.getAllFullCoverContractions(shape)
    if (foldBases.length == 0) {
        return null
    }
    let basis = random.choice(foldBases) as FoldSpecBasis
    let maxMultiplier = randomChoiceWeighted(
        random,
        [1, 2, 3, 4, 5],
        normalise([25, 50, 50, 10, 5])
    )
    let foldSpec = basis.atMultiplier(basis.maxMultiplier(maxMultiplier))
    let verification = verifyFold(shape.data.board, foldSpec, FOLD_ACTION.Contract, shape.data.id)
    if (!verificationAllOk(verification)) {
        return null
    }
    return foldSpec
}

export function detectSquare(shape: paper.Path, tol: number = 0.01): boolean {
    if (!(shape instanceof paper.Path)) return false
    if (shape.segments.length !== 4) return false
    const lengths = shape.segments.map((seg, i) => {
        const next = shape.segments[(i + 1) % 4]
        return seg.point.getDistance(next.point, true)
    })
    const firstLen = lengths[0]
    return lengths.every(l => Math.abs(l - firstLen) < tol)
}

type TriangleDetectionResult = {
    apex: paper.Point
    next: paper.Point
    previous: paper.Point
} | null

export function detectRemovableRightIsosceles(
    shape: paper.Path,
    tol: number = 0.01
): TriangleDetectionResult {
    if (!(shape instanceof paper.Path)) return null
    if (shape.segments.length !== 3) return null
    // find the vertex with 90 deg angle
    for (let i = 0; i < 3; i++) {
        const seg = shape.segments[i]
        let angle = getSegmentAngle(seg)

        if (Math.abs(angle - 90) < tol) {
            let hypotenuseMidpoint = seg.next.point.add(seg.previous.point).divide(2)
            // check the midpoint coords are close enough to integers
            if (
                Math.abs(hypotenuseMidpoint.x % 1) > tol ||
                Math.abs(hypotenuseMidpoint.y % 1) > tol
            ) {
                return null
            }
            // found the apex
            return {
                apex: seg.point,
                next: seg.next.point,
                previous: seg.previous.point
            }
        }
    }
    throw new Error(`Shape ${shape.id} is not a right isosceles triangle`)
}

export function tryRemoveSquare(board: Board, random: PRNG): Promise<void> | null {
    const tol = 0.01
    const candidates: number[] = []
    for (const [id, shape] of board.shapes.entries()) {
        if (!detectSquare(shape, tol)) continue
        candidates.push(id)
    }
    if (candidates.length === 0) return null
    const shapeId = random.choice(candidates)
    const shape = board.shapes.get(shapeId)
    if (!shape) return null
    let i = random.randRange(0, 4)
    let foldSpec = FoldSpec.fromSquare(shape, i)
    if (!verificationAllOk(verifyFold(board, foldSpec, FOLD_ACTION.Remove, shapeId))) {
        return null
    }
    return board.foldAsync(shapeId, foldSpec, FOLD_ACTION.Remove)
}

export function tryRemoveRightIsosceles(board: Board, random: PRNG): Promise<void> | null {
    const tol = 0.01
    const candidates: [number, TriangleDetectionResult][] = []
    for (const [id, shape] of board.shapes.entries()) {
        const result = detectRemovableRightIsosceles(shape, tol)
        if (!result) continue
        candidates.push([id, result])
    }
    if (candidates.length === 0) return null
    const [shapeId, { next, previous }] = random.choice(candidates)
    const shape = board.shapes.get(shapeId)
    if (!shape) return null
    let foldSpec: FoldSpec
    if (random.bool()) {
        foldSpec = FoldSpec.fromEndPoints(next, previous, FOLD_COVER.Right)
    } else {
        foldSpec = FoldSpec.fromEndPoints(previous, next, FOLD_COVER.Left)
    }
    if (!verificationAllOk(verifyFold(board, foldSpec, FOLD_ACTION.Remove, shapeId))) {
        return null
    }
    return board.foldAsync(shapeId, foldSpec, FOLD_ACTION.Remove)
}

export function tryCreate(
    board: Board,
    bounds: paper.Rectangle,
    random: PRNG,
    instantaneous = false
): Promise<void> | null {
    for (let attempt = 0; attempt < 10; attempt++) {
        let startVertex = random.choice(allVertices(bounds))
        let foldCover = random.choice(FOLD_COVERS)
        foldCover = FOLD_COVER.Full // it's broken with half covers
        let ray = random.choice(squareDiagonalRays(startVertex, foldCover))
        let rayMultiplier = randomChoiceWeighted(
            random,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            normalise([1000, 200, 50, 10, 5, 2, 1, 1, 1, 1])
        )
        let vector = ray.multiply(rayMultiplier)
        let endVertex = roundToGrid(startVertex.add(vector))
        let unfoldPlan = FoldSpec.fromEndPoints(startVertex, endVertex, foldCover)
        if (!isOnGrid(startVertex)) {
            // this needs fixing
            continue
        }
        if (!verificationAllOk(verifyFold(board, unfoldPlan, FOLD_ACTION.Create))) {
            continue
        }
        let unusedIndex = board.shapes.size == 0 ? 1 : Math.max(...board.shapes.keys()) + 1
        if (instantaneous) {
            board.foldInstantaneously(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
            return Promise.resolve()
        } else {
            return board.foldAsync(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
        }
    }
    return null
}
