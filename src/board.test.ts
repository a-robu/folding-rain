import { describe, expect, test } from "vitest"
import * as matchers from 'jest-extended';
expect.extend(matchers);
import { Board } from "./board"
import { Point } from "paper"

describe("Board", () => {
    describe("gridToPaperCoordinates", () => {
        test("converts grid point to paper coordinates", () => {
            const board = new Board(10, 10)
            const gridPoint = new Point(2, 3)
            const paperPoint = board.gridToPaperCoordinates(gridPoint)
            expect(paperPoint.x).toBe(50) // 2 * 25
            expect(paperPoint.y).toBe(75) // 3 * 25
        })
    })

    describe("gridToPaperCoordinates", () => {
        test("snaps to the nearest point (left)", () => {
            const board = new Board(2, 2)
            const paperPoint = new Point(board.gridIncrement / 2 - 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new Point(0, 0))
        })

        test("snaps to the nearest point (right)", () => {
            const board = new Board(2, 2)
            const paperPoint = new Point(board.gridIncrement / 2 + 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new Point(1, 0))
        })
    })
    
    describe("isInBounds", () => {
        test("checks if grid point is within bounds", () => {
            const board = new Board(10, 10)
            expect(board.isInBounds(new Point(5, 5))).toBe(true) // Inside bounds
            expect(board.isInBounds(new Point(10, 5))).toBe(false) // Out of bounds (x)
            expect(board.isInBounds(new Point(5, 10))).toBe(false) // Out of bounds (y)
            expect(board.isInBounds(new Point(-1, 5))).toBe(false) // Negative x
            expect(board.isInBounds(new Point(5, -1))).toBe(false) // Negative y
        }) 
    })

    describe("getBgNodes", () => {
        test("in a 2x2 grid, returns 4", () => {
            const board = new Board(2, 2)
            const bgNodes = board.getBgNodes()
            expect(bgNodes.length).toBe(4)
            expect(bgNodes).toIncludeSameMembers([
                new Point(0, 0),
                new Point(1, 0),
                new Point(0, 1),
                new Point(1, 1)
            ])
        })
    })

    describe("all90DegWedges", () => {
        test("on a 2x2 grid, returns just one wedge", () => {
            const board = new Board(2, 2)
            const wedges = board.all90DegWedges(new Point(0, 0))
            expect(wedges.length).toBe(1)
            expect(wedges[0]).toIncludeSameMembers([
                new Point(0, 1),
                new Point(1, 0)
            ])
        })

        test("in the middle of a 5x5 grid, returns 8 wedges", () => {
            const board = new Board(5, 5)
            const wedges = board.all90DegWedges(new Point(2, 2))
            expect(wedges.length).toBe(8)
        })
    })

    describe("allValidWedgeExpansions", () => {
        test("returns two options in the corner of a 3x3 grid", () => {
            const board = new Board(3, 3)
            const apex = new Point(0, 0)
            const wedge: [paper.Point, paper.Point] = [new Point(0, 1), new Point(1, 0)]
            const unfolds = board.allValidWedgeExpansions(apex, wedge)
            expect(unfolds.length).toBe(2)
            expect(unfolds[0].start).toEqual(apex)
            expect(unfolds[0].hinges).toIncludeSameMembers([new Point(0, 1), new Point(1, 0)])
            expect(unfolds[0].end).toEqual(new Point(1, 1))
            expect(unfolds[1].start).toEqual(apex)
            expect(unfolds[1].hinges).toIncludeSameMembers([new Point(0, 2), new Point(2, 0)])
            expect(unfolds[1].end).toEqual(new Point(2, 2))
        })
    })
})
