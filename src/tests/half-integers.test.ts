import { describe, expect, test } from "vitest"
import {
    isIntegerCoordinate,
    isHalfIntegerCoordinate,
    isOnTetrakisLattice,
    roundToHalfIntegerCoordinate
} from "@/lib/tetrakis"
import paper from "paper"

describe("isIntegerCoordinate", () => {
    test("returns true for integer coordinates", () => {
        expect(isIntegerCoordinate(new paper.Point(1, 2))).toBe(true)
        expect(isIntegerCoordinate(new paper.Point(0, 0))).toBe(true)
        expect(isIntegerCoordinate(new paper.Point(-3, 5))).toBe(true)
    })
    test("returns false for non-integer coordinates", () => {
        expect(isIntegerCoordinate(new paper.Point(1.5, 2))).toBe(false)
        expect(isIntegerCoordinate(new paper.Point(1, 2.5))).toBe(false)
        expect(isIntegerCoordinate(new paper.Point(1.1, 2.9))).toBe(false)
    })
})

describe("isHalfIntegerCoordinate", () => {
    test("returns true for half-integer coordinates", () => {
        expect(isHalfIntegerCoordinate(new paper.Point(0.5, 1.5))).toBe(true)
        expect(isHalfIntegerCoordinate(new paper.Point(2, 3.5))).toBe(true)
        expect(isHalfIntegerCoordinate(new paper.Point(-1.5, 0))).toBe(true)
    })
    test("returns false for non-half-integer coordinates", () => {
        expect(isHalfIntegerCoordinate(new paper.Point(0.25, 1.5))).toBe(false)
        expect(isHalfIntegerCoordinate(new paper.Point(2, 3.1))).toBe(false)
        expect(isHalfIntegerCoordinate(new paper.Point(-1.1, 0))).toBe(false)
    })
})

describe("isOnTetrakisLattice", () => {
    test("returns true for integer coordinates (corners)", () => {
        expect(isOnTetrakisLattice(new paper.Point(0, 0))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(2, 2))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(-3, 5))).toBe(true)
    })
    test("returns true for both coordinates half-integers (centers)", () => {
        expect(isOnTetrakisLattice(new paper.Point(0.5, 1.5))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(-1.5, 2.5))).toBe(true)
    })
    test("returns false for edge cases (one integer, one half-integer)", () => {
        expect(isOnTetrakisLattice(new paper.Point(1, 1.5))).toBe(false)
        expect(isOnTetrakisLattice(new paper.Point(0.5, 2))).toBe(false)
    })
    test("returns false for non-half-integer coordinates", () => {
        expect(isOnTetrakisLattice(new paper.Point(0.1, 0.1))).toBe(false)
        expect(isOnTetrakisLattice(new paper.Point(1.25, 1.75))).toBe(false)
    })
})

describe("roundToHalfIntegerCoordinate", () => {
    test("rounds to nearest half-integer coordinate (paper.Point)", () => {
        expect(roundToHalfIntegerCoordinate(new paper.Point(1, 2))).toBePaperPoint(
            new paper.Point(1, 2)
        )
        expect(roundToHalfIntegerCoordinate(new paper.Point(0.5, 1.5))).toBePaperPoint(
            new paper.Point(0.5, 1.5)
        )
        expect(roundToHalfIntegerCoordinate(new paper.Point(1.24, 2.26))).toBePaperPoint(
            new paper.Point(1, 2.5)
        )
        expect(roundToHalfIntegerCoordinate(new paper.Point(1.24, 2.24))).toBePaperPoint(
            new paper.Point(1, 2)
        )
        expect(roundToHalfIntegerCoordinate(new paper.Point(-1.26, -2.74))).toBePaperPoint(
            new paper.Point(-1.5, -2.5)
        )
    })
})
