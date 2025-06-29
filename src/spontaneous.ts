import paper from "paper"
import type PRNG from "random-seedable/@types/PRNG"
import { Board } from "./board"
import { verificationAllOk, verifyFold } from "@/lib/contacts"
import { FoldSpec, FOLD_ACTION, FOLD_COVERS, FOLD_COVER, type FoldAction } from "@/lib/fold-spec"
import { FoldSpecBasis } from "@/lib/fold-spec-basis"
import { allVertices, squareDiagonalRays, roundToGrid, isOnGrid } from "@/lib/grid"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { XORShift } from "random-seedable"
import { exponentialDelay, sleep } from "@/lib/time"
import { getSegmentAngle } from "./lib/vec"

export class ProceduralAnimation {
    private random: PRNG
    private board: Board
    bounds: paper.Rectangle

    constructor(board: Board, bounds: paper.Rectangle, seed?: number) {
        // ensure mandatory arguments are provided
        if (!board || !(board instanceof Board)) {
            throw new Error("A valid Board instance is required.")
        }
        if (!bounds || !(bounds instanceof paper.Rectangle)) {
            throw new Error("A valid paper.Rectangle bounds is required.")
        }
        this.board = board
        this.bounds = bounds
        this.random = new XORShift(seed)
    }

    async rainContinuously() {
        for (let i = 0; i < this.random.randRange(3, 10); i++) {
            let attempt = tryCreate(this.board, this.bounds, this.random)
            // if (attempt) {
            //     await attempt
            // }
        }
        while (true) {
            if (this.random.float() < 0.01) {
                tryCreate(this.board, this.bounds, this.random)
            }
            if (this.random.float() < 0.01) {
                tryRemoveSquare(this.board, this.random)
            }
            if (this.random.float() < 0.01) {
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
            if (this.board.shapes.size > 0 && this.random.float() < 0.1) {
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
    const [shapeId, { apex, next, previous }] = random.choice(candidates)
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
