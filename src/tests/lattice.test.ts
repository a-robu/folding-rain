import { describe, expect, test } from "vitest"
import * as matchers from "jest-extended"
expect.extend(matchers)
import paper from "paper"
import { DIR, BGFG, type CellState, type CardinalDir } from "@/lib/cell"
import { Lattice } from "@/lib/lattice"
import { isCloseTo } from "@/lib/integers"

describe("isCloseTo", () => {
    test("returns true for close values", () => {
        expect(isCloseTo(1.0, 1.00001, 0.001)).toBe(true)
    })

    test("returns false for distant values", () => {
        expect(isCloseTo(1.0, 1.1, 0.001)).toBe(false)
    })

    test("returns true for equal values", () => {
        expect(isCloseTo(1.0, 1.0, 0.001)).toBe(true)
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
            const lattice = new Lattice(2, 1)
            expect(lattice.width).toBe(2)
            expect(lattice.height).toBe(1)
            // just see that it doesn't throw an error if we get a cell from the right
            lattice.vertexNeighbors(new paper.Point(2, 0))
        })

        test("makes a tall lattice", () => {
            const lattice = new Lattice(1, 2)
            expect(lattice.width).toBe(1)
            expect(lattice.height).toBe(2)
            // just see that it doesn't throw an error if we get a cell from the right
            lattice.vertexNeighbors(new paper.Point(0, 2))
        })
    })

    describe("allVertices", () => {
        test("returns the right vertices for a 1x1 lattice", () => {
            const lattice = new Lattice(1, 1)
            const vertices = lattice.allVertices()
            expect(vertices).toIncludeSameMembers([
                new paper.Point(0, 0),
                new paper.Point(1, 0),
                new paper.Point(0, 1),
                new paper.Point(1, 1),
                new paper.Point(0.5, 0.5)
            ])
        })

        test.each([
            [8, 1, 2],
            [8, 2, 1],
            [13, 2, 2]
        ])("returns %s number of vertices for a %sx%s lattice", (expected, width, height) => {
            const lattice = new Lattice(width, height)
            const vertices = lattice.allVertices()
            expect(vertices.length).toBe(expected)
        })
    })

    describe("isPerimeterVertex", () => {
        test("returns true (0, 0)", () => {
            const lattice = new Lattice(1, 1)
            expect(lattice.isPerimeterVertex(new paper.Point(0, 0))).toBe(true)
        })

        test("returns false (1, 1) in a 2x2 lattice", () => {
            const lattice = new Lattice(2, 2)
            expect(lattice.isPerimeterVertex(new paper.Point(1, 1))).toBe(false)
        })
    })

    describe("allTriangles", () => {
        test("returns the right triangles for a 1x1 lattice", () => {
            const lattice = new Lattice(1, 1)
            const triangles = lattice.allTriangleIndices()
            expect(triangles).toIncludeSameMembers([
                { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                { cell: new paper.Point(0, 0), cardinalDirection: "W" }
            ])
        })

        test("returns the right triangles for a 2x2 lattice", () => {
            const lattice = new Lattice(2, 2)
            const triangles = lattice.allTriangleIndices()
            expect(triangles.length).toBe(16)
        })
    })

    describe("vertexNeighbors", () => {
        let lattice = new Lattice(2, 2)
        test.each([
            {
                description: "top-left corner",
                point: new paper.Point(0, 0),
                expected: [
                    { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "W" }
                ]
            },
            {
                description: "bottom-left corner",
                point: new paper.Point(0, 2),
                expected: [
                    { cell: new paper.Point(0, 1), cardinalDirection: "S" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "W" }
                ]
            },
            {
                description: "top-right corner",
                point: new paper.Point(2, 0),
                expected: [
                    { cell: new paper.Point(1, 0), cardinalDirection: "E" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "N" }
                ]
            },
            {
                description: "bottom-right corner",
                point: new paper.Point(2, 2),
                expected: [
                    { cell: new paper.Point(1, 1), cardinalDirection: "S" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "E" }
                ]
            },
            {
                description: "secondary-grid vertex",
                point: new paper.Point(0.5, 0.5),
                expected: [
                    { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "W" }
                ]
            },
            {
                description: "top edge vertex",
                point: new paper.Point(1, 0),
                expected: [
                    { cell: new paper.Point(0, 0), cardinalDirection: "N" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "W" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "N" }
                ]
            },
            {
                description: "left edge vertex",
                point: new paper.Point(0, 1),
                expected: [
                    { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "W" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "N" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "W" }
                ]
            },
            {
                description: "bottom edge vertex",
                point: new paper.Point(1, 2),
                expected: [
                    { cell: new paper.Point(0, 1), cardinalDirection: "S" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "E" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "W" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "S" }
                ]
            },
            {
                description: "right edge vertex",
                point: new paper.Point(2, 1),
                expected: [
                    { cell: new paper.Point(1, 0), cardinalDirection: "S" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "E" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "N" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "E" }
                ]
            },
            {
                description: "primary-grid vertex",
                point: new paper.Point(1, 1),
                expected: [
                    { cell: new paper.Point(1, 1), cardinalDirection: "N" },
                    { cell: new paper.Point(1, 1), cardinalDirection: "W" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "N" },
                    { cell: new paper.Point(0, 1), cardinalDirection: "E" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "S" },
                    { cell: new paper.Point(0, 0), cardinalDirection: "E" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "W" },
                    { cell: new paper.Point(1, 0), cardinalDirection: "S" }
                ]
            }
        ])("of the $description", ({ point, expected }) => {
            const neighbors = lattice.vertexNeighbors(point)
            for (let neighbor of neighbors) {
                expect(isCellCoordinate(neighbor.cell)).toBe(true)
            }
            expect(neighbors.length).toBe(expected.length)
            // The error message provided by toIncludeSameMembers is terrible.
            // So first check that each member in expected is in actual.
            for (let expectedNeighbor of expected) {
                expect(neighbors).toPartiallyContain(expectedNeighbor)
            }
            // Now, check that each member in actual is in expected.
            for (let neighbor of neighbors) {
                expect(expected).toPartiallyContain(neighbor)
            }
            // Now the actual assertion which should be redundant by now.
            expect(neighbors).toIncludeSameMembers(expected)
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
            expect(centroid.x).toBeCloseTo(0.5, 2)
            expect(centroid.y).toBeCloseTo((1 / 3) * 0.5, 2)
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
            for (let [dir, state] of [
                [DIR.N, BGFG.Shape],
                [DIR.E, null],
                [DIR.S, null],
                [DIR.W, null]
            ] as [CardinalDir, CellState][]) {
                expect(
                    lattice.getState({
                        cell: new paper.Point(0, 0),
                        cardinalDirection: dir
                    })
                ).toEqual(state)
            }
        })
    })

    describe("isVertexCoordinate", () => {
        test.each([
            {
                expected: false,
                x: 0.4,
                y: 0.1,
                description: "a point outside the lattice"
            },
            {
                expected: false,
                x: 0.5,
                y: 0,
                description: "a point on a horizontal square edge"
            },
            {
                expected: false,
                x: 4,
                y: 2.5,
                description: "point on a vertical square edge"
            },
            {
                expected: true,
                x: 1,
                y: 3,
                description: "a point on a square corner"
            },
            {
                expected: true,
                x: 2.5,
                y: 9.5,
                description: "a point on a square midpoint"
            }
        ])("returns %s for (%d, %d), %s", ({ expected, x, y }) => {
            const result = Lattice.isVertexCoordinate(new paper.Point(x, y))
            expect(result).toBe(expected)
        })
    })
})
