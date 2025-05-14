import { describe, expect, test } from "vitest"
import * as matchers from 'jest-extended';
expect.extend(matchers);
import paper from "paper";
import { isCloseTo, Cell, Lattice, DIR, BKFG } from "./lattice"

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

// describe("Cell", () => {
//     describe.skip("flipped", () => {
//         test.each([
//             ["-", "NE", "SE"],
//             ["|", "NW", "NE"],
//             ["\\", "NE", "SW"],
//             ["/", "NW", "SE"]
//         ])("flips along %s %s to %s", (axis, from, to) => {
//             let cell = new Cell();
//             cell.setMany(from, true);
//             let flipped = cell.flipped(axis);
//             expect(flipped.getAll()).toIncludeSameMembers(to.split(""));
//         })
//     })
// })

describe("Lattice", () => {
    describe("constructor", () => {
        test("makes a wide lattice", () => {
            const lattice = new Lattice(2, 1);
            expect(lattice.width).toBe(2);
            expect(lattice.height).toBe(1);
            // just see that it doesn't throw an error if we get a cell from the right
            lattice.vertexNeighbors(new paper.Point(2, 0));
        })

        test("makes a tall lattice", () => {
            const lattice = new Lattice(1, 2);
            expect(lattice.width).toBe(1);
            expect(lattice.height).toBe(2);
            // just see that it doesn't throw an error if we get a cell from the right
            lattice.vertexNeighbors(new paper.Point(0, 2));
        })
    })

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

    describe("allTriangles", () => {
        test("returns the right triangles for a 1x1 lattice", () => {
            const lattice = new Lattice(1, 1);
            const triangles = lattice.allTriangleIndices();
            expect(triangles).toIncludeSameMembers([
                { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                { cell: new paper.Point(0, 0), cardinalDirection: "W" }
            ]);
        })

        test("returns the right triangles for a 2x2 lattice", () => {
            const lattice = new Lattice(2, 2);
            const triangles = lattice.allTriangleIndices();
            expect(triangles.length).toBe(16);
        })
    })

    describe("vertexNeighbors", () => {
        let lattice = new Lattice(2, 2);
        test("returns two states for the top-left corner", () => {
            const neighbors = lattice.vertexNeighbors(new paper.Point(0, 0))
            expect(neighbors).toIncludeSameMembers([
                { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                { cell: new paper.Point(0, 0), cardinalDirection: "W" }
            ])
        })
        test("returns 4 states for a middle vertex", () => {
            const neighbors = lattice.vertexNeighbors(new paper.Point(0.5, 0.5))
            expect(neighbors.length).toBe(4)
            expect(neighbors).toIncludeSameMembers([
                { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                { cell: new paper.Point(0, 0), cardinalDirection: "W" }
            ])
        })
        test("returns 8 states for square corner vertex", () => {
            const neighbors = lattice.vertexNeighbors(new paper.Point(1, 1))
            expect(neighbors.length).toBe(8)
            expect(neighbors).toIncludeSameMembers([
                { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                { cell: new paper.Point(1, 0), cardinalDirection: "W" },
                { cell: new paper.Point(1, 0), cardinalDirection: "S" },
                { cell: new paper.Point(1, 1), cardinalDirection: "N" },
                { cell: new paper.Point(1, 1), cardinalDirection: "W" },
                { cell: new paper.Point(0, 1), cardinalDirection: "E" },
                { cell: new paper.Point(0, 1), cardinalDirection: "N" },
            ])
        })
    })

    describe("centroid", () => {
        test("returns the centroid of the 0,0,N triangle", () => {
            const centroid = Lattice.centroid({
                cell: new paper.Point(0, 0),
                cardinalDirection: DIR.N
            })
            // The N-side triangle is top-heavy, so the distance is 1/3 from
            // the top (and it only goes to the middle of the cell)
            expect(centroid.x).toBeCloseTo(0.5, 2);
            expect(centroid.y).toBeCloseTo(1/3 * 0.5, 2);
        })
    })

    describe("rasterizePatch", () => {
        test("returns N only for the minimal case in a 1x1 space", () => {
            let polygon = new paper.Path([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0.5, 0.5)
            ])
            let lattice = Lattice.rasterizePatch(new paper.Point(1, 1), polygon)
            expect(lattice.height).toEqual(1)
            expect(lattice.width).toEqual(1)
            let expected = new Map([
                [DIR.N, BKFG.Shape],
                [DIR.E, null],
                [DIR.S, null],
                [DIR.W, null]
            ])
            expect(lattice.cells[0][0].states).toEqual(expected)
        })
    })
})
