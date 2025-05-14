import { describe, expect, test } from "vitest"
import * as matchers from 'jest-extended';
expect.extend(matchers);
import paper from "paper"
import { isCloseTo, Cell, Lattice } from "./lattice"

describe("isCloseTo", () => {
    test("returns true for close values", () => {
        expect(isCloseTo(1.0, 1.00001, 0.001)).toBe(true);
    })

    test("returns false for distant values", () => {
        expect(isCloseTo(1.0, 1.1, 0.001)).toBe(false);
    })

    test("returns true for equal values", () => {
        expect(isCloseTo(1.0, 1.0, 0.001)).toBe(true);
    })
})

describe("Cell", () => {
    test.skip("setMany", () => {
        let cell = new Cell();
        cell.setMany("NE", true);
        expect(cell.N).toBe(true);
        expect(cell.E).toBe(true);
        expect(cell.S).toBe(false);
        expect(cell.W).toBe(false);
    })

    describe("flipped", () => {
        test.each([
            ["-", "NE", "SE"],
            ["|", "NW", "NE"],
            ["\\", "NE", "SW"],
            ["/", "NW", "SE"]
        ])("flips along %s %s to %s", (axis, from, to) => {
            let cell = new Cell();
            cell.setMany(from, true);
            let flipped = cell.flipped(axis);
            expect(flipped.getAll()).toEqual(new Set(to));
        })
    })
})

describe("Lattice", () => {
    describe("allVertices", () => {
        test("returns the right vertices for a 1x1 lattice", () => {
            const lattice = new Lattice(1, 1);
            const vertices = lattice.allVertices();
            expect(vertices).toIncludeSameMembers([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0, 1),
                new paper.Point(1, 1),
                new paper.Point(0.5, 0.5)
            ]);
        })

        test.each([
            [8, 1, 2],
            [8, 2, 1],
            [13, 2, 2]
        ])("returns %s number of vertices for a %sx%s lattice", (expected, width, height) => {
            const lattice = new Lattice(width, height);
            const vertices = lattice.allVertices();
            expect(vertices.length).toBe(expected);
        })
    })

    describe("isPerimeterVertex", () => {
        test("returns true (0, 0)", () => {
            const lattice = new Lattice(1, 1);
            expect(lattice.isPerimeterVertex(new paper.Point(0, 0))).toBe(true);
        })

        test("returns false (1, 1) in a 2x2 lattice", () => {
            const lattice = new Lattice(2, 2);
            expect(lattice.isPerimeterVertex(new paper.Point(1, 1))).toBe(false);
        })
    })
})
