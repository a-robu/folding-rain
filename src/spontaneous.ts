import paper from "paper"
import type PRNG from "random-seedable/@types/PRNG"
import { Board } from "./board"
import { verificationAllOk, verifyFold } from "@/lib/contacts"
import { FoldSpec, FOLD_ACTION, FOLD_COVERS, FOLD_COVER } from "@/lib/fold-spec"
import { FoldSpecBasis } from "@/lib/fold-spec-basis"
import { allVertices, squareDiagonalRays, roundToGrid, isOnGrid } from "@/lib/grid"
import { normalise, randomChoiceWeighted } from "@/lib/randomness"
import { XORShift } from "random-seedable"
import { sleep } from "@/lib/time"

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
        await tryCreate(this.board, this.bounds, this.random)
        while (true) {
            if (this.random.float() < 0.01) {
                tryCreate(this.board, this.bounds, this.random)
            }
            let shapeId: number | null = null
            let foldSpec: FoldSpec | null = null
            shapeId = this.random.choice(Array.from(this.board.shapes.keys()))
            let shape = this.board.shapes.get(shapeId!)
            foldSpec = randomlyChooseFold(shape!, this.random, this.bounds)
            if (foldSpec) {
                this.board.foldAsync(shapeId!, foldSpec, FOLD_ACTION.Expand)
            }
            await sleep(100)
        }
    }
}

export function randomlyChooseFold(
    shape: paper.Path,
    random: PRNG,
    bounds: paper.Rectangle
): FoldSpec | null {
    let clockwise = random.bool()
    let fullCover = random.bool()
    let foldBases = FoldSpecBasis.getAllBases(shape, clockwise, fullCover)
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

export function tryCreate(
    board: Board,
    bounds: paper.Rectangle,
    random: PRNG
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
        return board.foldAsync(unusedIndex, unfoldPlan, FOLD_ACTION.Create)
    }
    return null
}
