import paper from "paper"
import { FoldSpec } from "@/lib/fold-spec"
import { roundToHalfIntegers, validHingeLengths, type LinearEquation } from "@/lib/tetrakis"

/**
 * Defines all lattice-compliant folds along a vector.
 */
export class FoldSpecBasis {
    /**
     * One end of the hinge.
     */
    start: paper.Point
    /**
     * A unit-vector along the direction of the hinge.
     */
    basis: paper.Point
    /**
     * Defines all valid hinge lengths (coefficients must
     * be >= 1).
     */
    linearEquation: LinearEquation
    /**
     * The length of the original segment (hinges must not
     * exceed this length).
     */
    maxLength: number
    /**
     * If true, the tips of the folds will have 90° angles.
     * If false, the tips will have 45° angles and the start
     * hinge will have a 90° angle with the folds
     */
    fullCover: boolean
    /**
     * If true, that means the fold will come from the right
     * side of the vector to the left,
     */
    rightToLeft: boolean

    constructor(
        start: paper.Point,
        basis: paper.Point,
        linearEquation: LinearEquation,
        maxLength: number,
        fullCover: boolean,
        rightToLeft: boolean
    ) {
        this.start = start
        this.basis = basis
        this.linearEquation = linearEquation
        this.maxLength = maxLength
        this.fullCover = fullCover
        this.rightToLeft = rightToLeft
    }

    static getAllBases(path: paper.Path, clockwise: boolean, fullCover: boolean) {
        let bases: FoldSpecBasis[] = []
        let pointPairs: [paper.Point, paper.Point][] = []
        if (clockwise) {
            for (let segment of path.segments) {
                pointPairs.push([segment.point, segment.next.point])
            }
        } else {
            for (let segment of path.segments.slice().reverse()) {
                pointPairs.push([segment.point, segment.previous.point])
            }
        }

        for (let [start, end] of pointPairs) {
            let attempt = FoldSpecBasis.detectAlongSegment(start, end, clockwise, fullCover)
            if (attempt != null) {
                bases.push(attempt)
            }
        }
        return bases
    }

    static detectAlongSegment(
        fromVertex: paper.Point,
        toVertex: paper.Point,
        rightToLeft: boolean,
        fullCover: boolean
    ) {
        let segmentVector = toVertex.subtract(fromVertex)
        let linearEquation = validHingeLengths(fromVertex, segmentVector, fullCover)
        if (linearEquation === null) {
            return null
        }
        if (linearEquation.constant + linearEquation.coefficient > segmentVector.length) {
            // Refuse to create a basis which does not have any solutions
            return null
        }
        return new FoldSpecBasis(
            fromVertex,
            segmentVector.normalize(),
            linearEquation,
            segmentVector.length,
            fullCover,
            rightToLeft
        )
    }

    maxMultiplier() {
        return Math.floor(
            (this.maxLength - this.linearEquation.constant) / this.linearEquation.coefficient
        )
    }

    getAll() {
        let result: FoldSpec[] = []
        for (let i = 1; i <= this.maxMultiplier(); i++) {
            result.push(this.atMultiplier(i))
        }
        return result
    }

    atMultiplier(multiplier: number): FoldSpec {
        let hingeVector = this.basis.multiply(this.linearEquation.coefficient * multiplier)
        let [innerApex, outerApex] = this.fullCover
            ? [
                  roundToHalfIntegers(
                      this.start.add(
                          hingeVector.rotate(45, new paper.Point(0, 0)).multiply(Math.SQRT2 / 2)
                      )
                  ),
                  roundToHalfIntegers(
                      this.start.add(
                          hingeVector.rotate(-45, new paper.Point(0, 0)).multiply(Math.SQRT2 / 2)
                      )
                  )
              ]
            : [
                  roundToHalfIntegers(
                      this.start.add(hingeVector.rotate(90, new paper.Point(0, 0)))
                  ),
                  roundToHalfIntegers(
                      this.start.add(hingeVector.rotate(-90, new paper.Point(0, 0)))
                  )
              ]
        let [firstHinge, secondHinge] = [
            this.start,
            roundToHalfIntegers(this.start.add(hingeVector))
        ]
        if (!this.rightToLeft) {
            ;[innerApex, outerApex] = [outerApex, innerApex]
            ;[firstHinge, secondHinge] = [secondHinge, firstHinge]
        }
        return new FoldSpec(innerApex, [firstHinge, secondHinge], outerApex)
    }
}
