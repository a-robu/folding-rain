import { describe, expect, test } from "vitest"
import { isOnGrid } from "@/lib/grid"
import paper from "paper"

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
