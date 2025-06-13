import { describe, it, expect } from "vitest"
import paper from "paper"
import { angleBetweenVectors, discretizeAngle } from "../lib/vec"

describe("angleBetweenVectors", () => {
    it("returns 0 for identical vectors", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(0)
    })

    it("returns 180 for opposite vectors", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(-1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(180)
    })

    it("returns 90 for perpendicular vectors", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(0, 1)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(90)
    })

    it("returns a smaller number for pointy angles", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(1, 1)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(45)
    })

    it("returns a bigger number for concave angles", () => {
        const a = new paper.Point(1, 1)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(360 - 45)
    })

    it("returns 0 if either vector is zero", () => {
        const a = new paper.Point(0, 0)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBe(0)
        expect(angleBetweenVectors(b, a)).toBe(0)
        expect(angleBetweenVectors(a, a)).toBe(0)
    })
})

describe("angleBetweenVectors (directional)", () => {
    it("returns 0 for identical vectors", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(0)
    })
    it("returns 90 for (1,0) to (0,1)", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(0, 1)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(90)
    })
    it("returns 270 for (0,1) to (1,0)", () => {
        const a = new paper.Point(0, 1)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(270)
    })
    it("returns 45 for (1,0) to (1,1)", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(1, 1)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(45)
    })
    it("returns 315 for (1,1) to (1,0)", () => {
        const a = new paper.Point(1, 1)
        const b = new paper.Point(1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(315)
    })
    it("returns 180 for opposite vectors", () => {
        const a = new paper.Point(1, 0)
        const b = new paper.Point(-1, 0)
        expect(angleBetweenVectors(a, b)).toBeCloseTo(180)
    })
})

describe("discretizeAngle", () => {
    it("returns the same angle if already a multiple of 45", () => {
        expect(discretizeAngle(0)).toBe(0)
        expect(discretizeAngle(45)).toBe(45)
        expect(discretizeAngle(90)).toBe(90)
        expect(discretizeAngle(135)).toBe(135)
        expect(discretizeAngle(180)).toBe(180)
        expect(discretizeAngle(-45)).toBe(-45)
        expect(discretizeAngle(-90)).toBe(-90)
    })
    it("throws if angle is not a multiple of 45", () => {
        expect(() => discretizeAngle(10)).toThrow()
        expect(() => discretizeAngle(44.9)).toThrow()
        expect(() => discretizeAngle(46)).toThrow()
        expect(() => discretizeAngle(91)).toThrow()
    })
    it("handles floating point imprecision near multiples of 45", () => {
        expect(discretizeAngle(45.00001)).toBe(45)
        expect(discretizeAngle(89.99999)).toBe(90)
    })
})
