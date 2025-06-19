import { describe, test, expect } from "vitest"
import paper from "paper"
import { isOnGrid, allVertices, squareDiagonalRays, areHalfCoversValid } from "@/lib/grid"
import { FOLD_COVER } from "@/lib/fold-spec"

describe("allVertices", () => {
    test("returns correct vertices for 1x1 rect", () => {
        const rect = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(1, 1))
        const verts = allVertices(rect)
        // Should include all 4 corners and center
        expect(verts.length).toBe(4)
        expect(verts).toContainEqual(new paper.Point(0, 0))
        expect(verts).toContainEqual(new paper.Point(1, 0))
        expect(verts).toContainEqual(new paper.Point(0, 1))
        expect(verts).toContainEqual(new paper.Point(1, 1))
    })
})

describe("isIntegerCoordinate", () => {
    test("returns true for integer coordinates", () => {
        expect(isOnGrid(new paper.Point(1, 2))).toBe(true)
        expect(isOnGrid(new paper.Point(0, 0))).toBe(true)
        expect(isOnGrid(new paper.Point(-3, 5))).toBe(true)
    })
    test("returns false for non-integer coordinates", () => {
        expect(isOnGrid(new paper.Point(1.5, 2))).toBe(false)
        expect(isOnGrid(new paper.Point(1, 2.5))).toBe(false)
        expect(isOnGrid(new paper.Point(1.1, 2.9))).toBe(false)
    })
})

describe("validFoldCovers", () => {
    test("integer vertex, axis-aligned, even length", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(2, 0))
        expect(covers).toBe(true)
    })
    test("integer vertex, axis-aligned, odd length", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(1, 0))
        expect(covers).toBe(false)
    })
    test("integer vertex, diagonal", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(1, 1))
        expect(covers).toBe(true)
    })
    test("throws on invalid vertex", () => {
        expect(() => areHalfCoversValid(new paper.Point(0.1, 0.1), new paper.Point(1, 0))).toThrow()
    })
})
