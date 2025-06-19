import paper from "paper"
import { FoldSpec } from "@/lib/fold-spec"
import { hingeLengthFactors, roundToGrid } from "@/lib/grid"
import { getSegmentAngle } from "./vec"

export const SPEC_BASIS_TYPE = {
    HingeRightToLeft: "HingeRightToLeft",
    HingeLeftToRight: "HingeLeftToRight",
    DiagonalStartToEnd: "DiagonalStartToEnd"
}
export type SpecBasisType = (typeof SPEC_BASIS_TYPE)[keyof typeof SPEC_BASIS_TYPE]

/**
 * Defines all grid-compliant folds along a vector.
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
    coefficient: number
    /**
     * The length of the original segment (hinges must not
     * exceed this length).
     */
    private segmentLength: number
    /**
     * If true, the tips of the folds will have 90° angles.
     * If false, the tips will have 45° angles and the start
     * hinge will have a 90° angle with the folds
     */
    fullCover: boolean
    basisType: SpecBasisType

    constructor(
        start: paper.Point,
        basis: paper.Point,
        coefficient: number,
        segmentLength: number,
        fullCover: boolean,
        basisType: SpecBasisType
    ) {
        this.start = start
        this.basis = basis
        this.coefficient = coefficient
        this.segmentLength = segmentLength
        this.fullCover = fullCover
        this.basisType = basisType
    }

    static getAllExpansions(path: paper.Path, clockwise: boolean, fullCover: boolean) {
        if (!path) {
            throw new Error("Path the path argument is required")
        }
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
            let attempt = FoldSpecBasis.getExpansionAlongSegment(start, end, clockwise, fullCover)
            if (attempt != null) {
                bases.push(attempt)
            }
        }
        return bases
    }

    static getExpansionAlongSegment(
        fromVertex: paper.Point,
        toVertex: paper.Point,
        rightToLeft: boolean,
        fullCover: boolean
    ) {
        let segmentVector = toVertex.subtract(fromVertex)
        let coefficient = hingeLengthFactors(fromVertex, segmentVector, fullCover)
        if (coefficient > segmentVector.length) {
            // Refuse to create a basis which does not have any solutions
            return null
        }
        return new FoldSpecBasis(
            fromVertex,
            segmentVector.normalize(),
            coefficient,
            segmentVector.length,
            fullCover,
            rightToLeft ? SPEC_BASIS_TYPE.HingeRightToLeft : SPEC_BASIS_TYPE.HingeLeftToRight
        )
    }

    static getAllFullCoverContractions(path: paper.Path) {
        if (!path) {
            throw new Error("Path the path argument is required")
        }
        let bases: FoldSpecBasis[] = []
        for (let segment of path.segments) {
            if (Math.abs(getSegmentAngle(segment) - 90) > 0.01) {
                continue
            }
            let vectorToNext = segment.next.point.subtract(segment.point)
            let vectorToPrevious = segment.previous.point.subtract(segment.point)
            let contractionVector = vectorToNext.rotate(45, new paper.Point(0, 0))
            let basis = new FoldSpecBasis(
                segment.point,
                contractionVector.normalize(),
                // technically the hinge is different from the fold diagonal, but
                // they happend to be exactly the same 🤦
                hingeLengthFactors(segment.point, contractionVector, true),
                Math.min(vectorToNext.length, vectorToPrevious.length) * Math.SQRT2,
                true,
                SPEC_BASIS_TYPE.DiagonalStartToEnd
            )
            bases.push(basis)
        }
        return bases
    }

    maxMultiplier(lengthLimit?: number) {
        let appliedLimit = this.segmentLength
        if (lengthLimit !== undefined) {
            appliedLimit = Math.min(appliedLimit, Math.max(this.coefficient, lengthLimit))
        }
        return Math.floor(appliedLimit / this.coefficient + 0.001)
    }

    getAll() {
        let result: FoldSpec[] = []
        for (let i = 1; i <= this.maxMultiplier(); i++) {
            result.push(this.atMultiplier(i))
        }
        return result
    }

    atMultiplier(multiplier: number): FoldSpec {
        if (this.basisType === SPEC_BASIS_TYPE.DiagonalStartToEnd) {
            let diagonalVector = this.basis.multiply(multiplier * this.coefficient)
            let midpoint = this.start.add(diagonalVector.multiply(0.5))
            let [leftHinge, rightHinge] = [
                roundToGrid(
                    midpoint.add(diagonalVector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
                ),
                roundToGrid(
                    midpoint.add(diagonalVector.multiply(0.5).rotate(90, new paper.Point(0, 0)))
                )
            ]
            return new FoldSpec(
                this.start,
                [leftHinge, rightHinge],
                roundToGrid(this.start.add(diagonalVector))
            )
        }

        let hingeVector = this.basis.multiply(multiplier * this.coefficient)
        let [innerApex, outerApex] = this.fullCover
            ? [
                  roundToGrid(
                      this.start.add(
                          hingeVector.rotate(45, new paper.Point(0, 0)).multiply(Math.SQRT2 / 2)
                      )
                  ),
                  roundToGrid(
                      this.start.add(
                          hingeVector.rotate(-45, new paper.Point(0, 0)).multiply(Math.SQRT2 / 2)
                      )
                  )
              ]
            : [
                  roundToGrid(this.start.add(hingeVector.rotate(90, new paper.Point(0, 0)))),
                  roundToGrid(this.start.add(hingeVector.rotate(-90, new paper.Point(0, 0))))
              ]
        let [firstHinge, secondHinge] = [this.start, roundToGrid(this.start.add(hingeVector))]
        if (this.basisType === SPEC_BASIS_TYPE.HingeLeftToRight) {
            ;[innerApex, outerApex] = [outerApex, innerApex]
            ;[firstHinge, secondHinge] = [secondHinge, firstHinge]
        }
        // if (this.basisType === SPEC_BASIS_TYPE.DiagonalStartToEnd) {
        //     // ok this is really unreasonable
        //     ;[innerApex, outerApex, firstHinge, secondHinge] = [
        //         firstHinge,
        //         secondHinge,
        //         innerApex,
        //         outerApex
        //     ]
        // }
        return new FoldSpec(innerApex, [firstHinge, secondHinge], outerApex)
    }
}
