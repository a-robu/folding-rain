import { describe, expect, test } from "vitest"
import * as matchers from 'jest-extended';
expect.extend(matchers);
import { defineUnfoldFromBg, snapToDiagonalOrAALine } from "./interact"
import { Point } from "paper"

describe("snapToDiagonalOrAALine", () => {
    test("snaps to horizontal line (for an almost horizontal line)", () => {
        const start = new Point(0, 0)
        const end = new Point(10, 1)
        const snappedPoint = snapToDiagonalOrAALine(start, end)
        expect(snappedPoint.x).toBe(10)
        expect(snappedPoint.y).toBe(0)
    })

    test("snaps to vertical line (for an almost vertical line)", () => {
        const start = new Point(0, 0)
        const end = new Point(1, 10)
        const snappedPoint = snapToDiagonalOrAALine(start, end)
        expect(snappedPoint.x).toBe(0)
        expect(snappedPoint.y).toBe(10)
    })

    test("snaps to diagonal line (for an almost diagonal line)", () => {
        const start = new Point(0, 0)
        // lol honestly not sure exactly how long the snapped diagonal needs to be
        const end = new Point(10, 9)
        const snappedPoint = snapToDiagonalOrAALine(start, end)
        expect(snappedPoint.x).toBe(10)
        expect(snappedPoint.y).toBe(10)
    })
})

describe("defineUnfoldFromBg", () => {
    test("creates a axis-aligned square when given a diagonal line", () => {
        const start = new Point(0, 0)
        const end = new Point(1, 1)
        const result = defineUnfoldFromBg(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new Point(1, 0), new Point(0, 1)])
        expect(result.end).toEqual(end)
    })

    test("creates a 45-degree rotated square when given a horizontal line", () => {
        const start = new Point(0, 1)
        const end = new Point(2, 1)
        const result = defineUnfoldFromBg(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new Point(1, 0), new Point(1, 2)])
        expect(result.end).toEqual(end)
    })

    test("creates a 45-degree rotated square when given a vertical line", () => {
        const start = new Point(1, 0)
        const end = new Point(1, 2)
        const result = defineUnfoldFromBg(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new Point(0, 1), new Point(2, 1)])
        expect(result.end).toEqual(end)
    })
})