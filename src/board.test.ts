import { describe, expect, test } from "vitest"
import * as matchers from "jest-extended"
expect.extend(matchers)
import { Board } from "./board"
import paper from "paper"
import { BKFG, DIR, Lattice, type CardinalDir, type CellState } from "./mathy/lattice"

describe("Board", () => {
    describe("snapToNearestVertex", () => {
        test.each([
            [0.05, -0.03, 0, 0],
            [-0.99, 0.99, -1, 1],
            [0.49, 0.50001, 0.5, 0.5]
        ])("snaps (%f, %f) to (%d, %d)", (x, y, expectedX, expectedY) => {
            let snapped = Board.snapToNearestVertex(new paper.Point(x, y))
            expect(snapped).toEqual(new paper.Point(expectedX, expectedY))
        })
    })

    describe("walkAlongLine", () => {
        test("walks along a horizontal line", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(3, 0)
            const points = Board.walkAlongLine(start, end)
            expect(points).toEqual([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(2, 0),
                new paper.Point(3, 0)
            ])
        })

        test("walks along a vertical line", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(0, 3)
            const points = Board.walkAlongLine(start, end)
            expect(points).toEqual([
                new paper.Point(0, 0),
                new paper.Point(0, 1),
                new paper.Point(0, 2),
                new paper.Point(0, 3)
            ])
        })

        test("walks along a diagonal line", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(2, 2)
            const points = Board.walkAlongLine(start, end)
            expect(points).toEqual([
                new paper.Point(0, 0),
                new paper.Point(0.5, 0.5),
                new paper.Point(1, 1),
                new paper.Point(1.5, 1.5),
                new paper.Point(2, 2)
            ])
        })
    })

    describe("walkAlongPath", () => {
        test("minimal example", () => {
            const path = new paper.Path([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0.5, 0.5),
                new paper.Point(0, 1)
            ])
            const points = Board.walkAlongPath(path)
            expect(points).toIncludeSameMembers([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0.5, 0.5),
                new paper.Point(0, 1)
            ])
        })
    })

    describe("isInBounds", () => {
        test("checks if grid point is within bounds", () => {
            const board = new Board(10, 10)
            expect(board.vertexIsInBounds(new paper.Point(5, 5))).toBe(true) // Inside bounds
            expect(board.vertexIsInBounds(new paper.Point(11, 5))).toBe(false) // Out of bounds (x)
            expect(board.vertexIsInBounds(new paper.Point(5, 11))).toBe(false) // Out of bounds (y)
            expect(board.vertexIsInBounds(new paper.Point(-1, 5))).toBe(false) // Negative x
            expect(board.vertexIsInBounds(new paper.Point(5, -1))).toBe(false) // Negative y
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
            for (let [dir, state] of [
                [DIR.N, BKFG.Shape],
                [DIR.E, null],
                [DIR.S, null],
                [DIR.W, null]
            ] as [CardinalDir, CellState][]) {
                expect(
                    patch.lattice.getState({
                        cell: new paper.Point(0, 0),
                        cardinalDirection: dir
                    })
                ).toEqual(state)
            }
            expect(patch.offset).toEqual(new paper.Point(1, 0))
        })
    })

    describe("applyPatch", () => {
        test("applies correct number to lattice", () => {
            let board = new Board(1, 1)
            let justWLattice = new Lattice(1, 1)
            justWLattice.setState(
                {
                    cell: new paper.Point(0, 0),
                    cardinalDirection: DIR.W
                },
                BKFG.Shape
            )
            board.applyPatch(
                {
                    offset: new paper.Point(0, 0),
                    lattice: justWLattice
                },
                1
            )
            for (let [dir, state] of [
                [DIR.N, BKFG.Background],
                [DIR.E, BKFG.Background],
                [DIR.S, BKFG.Background],
                [DIR.W, 1]
            ] as [CardinalDir, CellState][]) {
                expect(
                    board.lattice.getState({
                        cell: new paper.Point(0, 0),
                        cardinalDirection: dir
                    })
                ).toEqual(state)
            }
            let justELattice = new Lattice(1, 1)
            justELattice.setState(
                {
                    cell: new paper.Point(0, 0),
                    cardinalDirection: DIR.E
                },
                BKFG.Shape
            )
            board.applyPatch(
                {
                    offset: new paper.Point(0, 0),
                    lattice: justELattice
                },
                2
            )
            for (let [dir, state] of [
                [DIR.N, BKFG.Background],
                [DIR.E, 2],
                [DIR.S, BKFG.Background],
                [DIR.W, 1]
            ] as [CardinalDir, CellState][]) {
                expect(
                    board.lattice.getState({
                        cell: new paper.Point(0, 0),
                        cardinalDirection: dir
                    })
                ).toEqual(state)
            }
        })
    })
})
