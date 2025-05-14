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

// describe("Vertex2D", () => {
//     describe.skip("when placed inside a set", () => {
//         test("duplicates are not added", () => {
//             const set = new Set<Vector2D>();
//             const v1 = new Vector2D(1.0, 1.0);
//             const v2 = new Vector2D(1.0, 1.0);
//             set.add(v1);
//             set.add(v2);
//             expect(set.size).toBe(1);            
//         })
//     })

//     test("isCloseTo", () => {
//         let v = new Vector2D(1.0, 1.0);
//         expect(v.isCloseTo(new Vector2D(1.0, 1.00001))).toBe(true);
//         expect(v.isCloseTo(new Vector2D(1.0, 1.05))).toBe(true);
//         expect(v.isCloseTo(new Vector2D(1.0, 1.0))).toBe(true);
//         expect(v.isCloseTo(new Vector2D(1.0, 1.3))).toBe(false);
//     })
// })

describe("Cell", () => {
    test.skip("setMany", () => {
        let cell = new Cell();
        cell.setMany("NE", true);
        expect(cell.N).toBe(true);
        expect(cell.E).toBe(true);
        expect(cell.S).toBe(false);
        expect(cell.W).toBe(false);
    })

    // describe("drawStringLines", () => {
    //     test.each([
    //         ["N", [
    //             "◥◤",
    //             "    "
    //         ]],
    //         ["S", [
    //             "    ",
    //             "◢◣"
    //         ]],
    //         ["W", [
    //             "◣ ",
    //             "◤ "
    //         ]],
    //         ["E", [
    //             " ◢",
    //             " ◥"
    //         ]]
    //     ])("draws %s triangle", (direction, lines) => {
    //         let cell = new Cell();
    //         cell.set(direction, true);
    //         expect(cell.drawAsStringLines()).toEqual(lines);
    //     })

    //     test("draws empty cell", () => {
    //         let cell = new Cell();
    //         expect(cell.drawAsStringLines()).toEqual([
    //             "    ",
    //             "    "
    //         ]);
    //     })

    //     test("draws full cell", () => {
    //         let cell = new Cell();
    //         cell.setMany("NSEW", true);
    //         expect(cell.drawAsStringLines()).toEqual([
    //             "■■",
    //             "■■"
    //         ]);
    //     })

    //     test.each([
    //         ["NW", [
    //             "■◤",
    //             "◤ "
    //         ]],
    //         ["SW", [
    //             "◣ ",
    //             "■◣"
    //         ]],
    //         ["SE", [
    //             " ◢",
    //             "◢■"
    //         ]],
    //         ["NE", [
    //             "◥■",
    //             " ◥"
    //         ]]
    //     ])("draws connected %s triangles", (directions, lines) => {
    //         let cell = new Cell();
    //         cell.setMany(directions, true);
    //         expect(cell.drawAsStringLines()).toEqual(lines);
    //     })
    // })

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

    // describe("drawAsString", () => {
    //     test("draws a 45 deg rotated square in the middle of a 2x2 lattice", () => {
    //         const lattice = new Lattice(2, 2);
    //         lattice.cells[0][0].setMany("SE", true);
    //         lattice.cells[1][0].setMany("SW", true);
    //         lattice.cells[0][1].setMany("NE", true);
    //         lattice.cells[1][1].setMany("NW", true);
    //         expect(lattice.drawAsString()).toBe(
    //             " ◢◣ \n" +
    //             "◢■■◣\n" +
    //             "◥■■◤\n" +
    //             " ◥◤ \n"
    //         );
    //     })
    // })

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
