import { describe, expect, test } from "vitest"
import * as matchers from 'jest-extended';
expect.extend(matchers);
import { Board } from "./board"
import paper from 'paper';
import { BKFG, DIR, Lattice } from "./mathy/lattice";

describe("Board", () => {
    describe("gridToPaperCoordinates", () => {
        test("converts grid point to paper coordinates", () => {
            const board = new Board(10, 10)
            const gridPoint = new paper.Point(2, 3)
            const paperPoint = board.gridToPaperCoordinates(gridPoint)
            expect(paperPoint.x).toBe(50) // 2 * 25
            expect(paperPoint.y).toBe(75) // 3 * 25
        })
    })

    describe("gridToPaperCoordinates", () => {
        test("snaps to the nearest point (left)", () => {
            const board = new Board(2, 2)
            const paperPoint = new paper.Point(board.gridIncrement / 2 - 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new paper.Point(0, 0))
        })

        test("snaps to the nearest point (right)", () => {
            const board = new Board(2, 2)
            const paperPoint = new paper.Point(board.gridIncrement / 2 + 1, 0)
            expect(board.paperToGridCoordinates(paperPoint)).toEqual(new paper.Point(1, 0))
        })
    })
    
    describe("isInBounds", () => {
        test("checks if grid point is within bounds", () => {
            const board = new Board(10, 10)
            expect(board.isInBounds(new paper.Point(5, 5))).toBe(true) // Inside bounds
            expect(board.isInBounds(new paper.Point(11, 5))).toBe(false) // Out of bounds (x)
            expect(board.isInBounds(new paper.Point(5, 11))).toBe(false) // Out of bounds (y)
            expect(board.isInBounds(new paper.Point(-1, 5))).toBe(false) // Negative x
            expect(board.isInBounds(new paper.Point(5, -1))).toBe(false) // Negative y
        }) 
    })

    describe("getBgNodes", () => {
        test("in a 1x1 grid, returns 4", () => {
            const board = new Board(1, 1)
            const bgNodes = board.getBgNodes()
            expect(bgNodes.length).toBe(4)
            expect(bgNodes).toIncludeSameMembers([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0, 1),
                new paper.Point(1, 1)
            ])
        })
    })

    describe("all90DegWedges", () => {
        test("on a 2x2 grid, returns just one wedge", () => {
            const board = new Board(2, 2)
            const wedges = board.all90DegWedges(new paper.Point(0, 0))
            expect(wedges.length).toBe(1)
            expect(wedges[0]).toIncludeSameMembers([
                new paper.Point(0, 1),
                new paper.Point(1, 0)
            ])
        })

        test("in the middle of a 5x5 grid, returns 8 wedges", () => {
            const board = new Board(5, 5)
            const wedges = board.all90DegWedges(new paper.Point(2, 2))
            expect(wedges.length).toBe(8)
        })
    })

    describe("allValidWedgeExpansions", () => {
        test("returns two options in the corner of a 2x2 grid", () => {
            const board = new Board(2, 2)
            const apex = new paper.Point(0, 0)
            const wedge: [paper.Point, paper.Point] = [new paper.Point(0, 1), new paper.Point(1, 0)]
            const unfolds = board.allValidWedgeExpansions(apex, wedge)
            expect(unfolds.length).toBe(2)
            expect(unfolds[0].start).toEqual(apex)
            expect(unfolds[0].hinges).toIncludeSameMembers(
                [new paper.Point(0, 1), new paper.Point(1, 0)])
            expect(unfolds[0].end).toEqual(new paper.Point(1, 1))
            expect(unfolds[1].start).toEqual(apex)
            expect(unfolds[1].hinges).toIncludeSameMembers(
                [new paper.Point(0, 2), new paper.Point(2, 0)])
            expect(unfolds[1].end).toEqual(new paper.Point(2, 2))
        })

        test("avoids unfolding over pre-existing shapes",() => {
            const board = new Board(2, 2)
            board.newShape(new paper.Path([
                new paper.Point(1, 1),
                new paper.Point(1, 2),
                new paper.Point(2, 1),
                new paper.Point(2, 2)
            ]))
            const apex = new paper.Point(0, 0)
            const wedge: [paper.Point, paper.Point] = [new paper.Point(0, 1), new paper.Point(1, 0)]
            const unfolds = board.allValidWedgeExpansions(apex, wedge)
            expect(unfolds.length).toBe(1)
        })
    })

    describe("rasterize", () => {
        test("given an offset polygon, returns a patch with an offset", () => {
            let polygon = new paper.Path([
                new paper.Point(1 + 0, 0),
                new paper.Point(1 + 1, 0),
                new paper.Point(1 + 0.5, 0.5)
            ])
            let patch = Board.rasterize(polygon)
            expect(patch.lattice.height).toBe(1)
            expect(patch.lattice.width).toBe(1)
            expect(patch.lattice.cells[0][0].states).toEqual(new Map([
                [DIR.N, BKFG.Shape],
                [DIR.E, null],
                [DIR.S, null],
                [DIR.W, null] ]))
            expect(patch.offset).toEqual(new paper.Point(1, 0))
        })
    })

    describe("applyPatch", () => {
        test("applies correct number to lattice", () => {
            let board = new Board(1, 1)
            let justWLattice = new Lattice(1, 1)
            justWLattice.cells[0][0].states.set(DIR.W, BKFG.Shape)
            board.applyPatch({
                offset: new paper.Point(0, 0),
                lattice: justWLattice
            }, 1)
            let actualCellState = board.lattice.cells[0][0].states
            expect(actualCellState.get(DIR.N)).toEqual(BKFG.Background)
            expect(actualCellState.get(DIR.E)).toEqual(BKFG.Background)
            expect(actualCellState.get(DIR.S)).toEqual(BKFG.Background)
            expect(actualCellState.get(DIR.W)).toEqual(1)
            let justELattice = new Lattice(1, 1)
            justELattice.cells[0][0].states.set(DIR.E, BKFG.Shape)
            board.applyPatch({
                offset: new paper.Point(0, 0),
                lattice: justELattice
            }, 2)
            actualCellState = board.lattice.cells[0][0].states
            expect(actualCellState.get(DIR.N)).toEqual(BKFG.Background)
            expect(actualCellState.get(DIR.E)).toEqual(2)
            expect(actualCellState.get(DIR.S)).toEqual(BKFG.Background)
            expect(actualCellState.get(DIR.W)).toEqual(1)
        })
            
    })
})
