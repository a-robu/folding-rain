import { describe, expect, test } from "vitest"
import { Board } from "./board"
import { Point } from "paper"

describe("Board", () => {
    describe("constructor", () => {
        test("initializes gridSize", () => {
            const board = new Board(10)
            expect(board.gridSize).toBe(10)
        })
    })

    describe("gridToPaperCoordinates", () => {
        test("converts grid point to paper coordinates", () => {
            const board = new Board(10)
            const gridPoint = new Point(2, 3)
            const paperPoint = board.gridToPaperCoordinates(gridPoint)
            expect(paperPoint.x).toBe(50) // 2 * 25
            expect(paperPoint.y).toBe(75) // 3 * 25
        })
    })

    describe("gridToPaperCoordinates", () => {
        test("snaps to the nearest point (left)", () => {
            const board = new Board(2)
            const paperPoint = new Point(board.gridIncrement / 2 - 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new Point(0, 0))
        })

        test("snaps to the nearest point (right)", () => {
            const board = new Board(2)
            const paperPoint = new Point(board.gridIncrement / 2 + 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new Point(1, 0))
        })
    })
    
    describe("isInBounds", () => {
        test("checks if grid point is within bounds", () => {
             const board = new Board(10)
             expect(board.isInBounds(new Point(5, 5))).toBe(true) // Inside bounds
             expect(board.isInBounds(new Point(10, 5))).toBe(false) // Out of bounds (x)
             expect(board.isInBounds(new Point(5, 10))).toBe(false) // Out of bounds (y)
             expect(board.isInBounds(new Point(-1, 5))).toBe(false) // Negative x
             expect(board.isInBounds(new Point(5, -1))).toBe(false) // Negative y
        }) 
    })
})

