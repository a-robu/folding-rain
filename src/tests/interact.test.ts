import { describe, expect, test } from "vitest"
import * as matchers from "jest-extended"
expect.extend(matchers)
import { createFold } from "@/lib/fold"
import paper from "paper"

describe("defineUnfoldFromBg", () => {
    test("creates a axis-aligned square when given a diagonal line", () => {
        const start = new paper.Point(0, 0)
        const end = new paper.Point(1, 1)
        const result = createFold(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new paper.Point(1, 0), new paper.Point(0, 1)])
        expect(result.end).toEqual(end)
    })

    test("creates a 45-degree rotated square when given a horizontal line", () => {
        const start = new paper.Point(0, 1)
        const end = new paper.Point(2, 1)
        const result = createFold(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new paper.Point(1, 0), new paper.Point(1, 2)])
        expect(result.end).toEqual(end)
    })

    test("creates a 45-degree rotated square when given a vertical line", () => {
        const start = new paper.Point(1, 0)
        const end = new paper.Point(1, 2)
        const result = createFold(start, end)
        expect(result.start).toEqual(start)
        expect(result.hinges).toIncludeSameMembers([new paper.Point(0, 1), new paper.Point(2, 1)])
        expect(result.end).toEqual(end)
    })
})
