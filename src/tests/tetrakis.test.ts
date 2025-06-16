import { describe, test, expect } from "vitest"
import paper from "paper"
import {
    CardinalSides,
    triangleIdxToKey,
    triangleIdxFromKey,
    isIntegerCoordinate,
    isHalfIntegerCoordinate,
    isOnTetrakisLattice,
    roundToHalfIntegers,
    allVertices,
    allTriangleIdxs,
    makeTrianglePolygon,
    squareDiagonalsFromVertex,
    SIDE,
    areHalfCoversValid
} from "@/lib/tetrakis"
import { FOLD_COVER } from "@/lib/fold-spec"

describe("triangleIdxToKey / triangleIdxFromKey", () => {
    test("converts TriangleIdx to key and back", () => {
        const idx = { squareIdx: new paper.Point(2, 3), cardinalSide: SIDE.N }
        const key = triangleIdxToKey(idx)
        expect(key).toBe("2,3,N")
        const idx2 = triangleIdxFromKey(key)
        expect(idx2.squareIdx.equals(idx.squareIdx)).toBe(true)
        expect(idx2.cardinalSide).toBe(idx.cardinalSide)
    })
    test("throws on invalid key", () => {
        expect(() => triangleIdxFromKey("2,3")).toThrow()
        expect(() => triangleIdxFromKey("2,3,X")).toThrow()
    })
})

describe("allVertices", () => {
    test("returns correct vertices for 1x1 rect", () => {
        const rect = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(1, 1))
        const verts = allVertices(rect)
        // Should include all 4 corners and center
        expect(verts).toContainEqual(new paper.Point(0, 0))
        expect(verts).toContainEqual(new paper.Point(1, 0))
        expect(verts).toContainEqual(new paper.Point(0, 1))
        expect(verts).toContainEqual(new paper.Point(1, 1))
        expect(verts).toContainEqual(new paper.Point(0.5, 0.5))
    })
})

describe("allTriangleIdxs", () => {
    test("returns 4 triangles per cell", () => {
        const rect = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(2, 2))
        const tris = allTriangleIdxs(rect)
        // 2x2 cells, 4 triangles per cell
        expect(tris.length).toBe(4 * 2 * 2)
        for (const tri of tris) {
            expect(CardinalSides).toContain(tri.cardinalSide)
        }
    })
})

describe("makeTrianglePolygon", () => {
    test("returns a closed triangle path", () => {
        const idx = { squareIdx: new paper.Point(0, 0), cardinalSide: SIDE.N }
        const path = makeTrianglePolygon(idx)
        expect(path.area).toBeGreaterThan(0)
        expect(path.closed).toBe(true)
        expect(path.segments.length).toBe(3)
    })
})

describe("squareDiagonalsFromVertex", () => {
    test("returns correct rays for integer vertex", () => {
        const rays = squareDiagonalsFromVertex(new paper.Point(0, 0))
        expect(rays.length).toBe(8)
        expect(rays).toContainEqual(new paper.Point(2, 0))
        expect(rays).toContainEqual(new paper.Point(0, 2))
        expect(rays).toContainEqual(new paper.Point(1, 1))
        expect(rays).toContainEqual(new paper.Point(-1, 1))
    })
    test("returns correct rays for half-integer vertex", () => {
        const rays = squareDiagonalsFromVertex(new paper.Point(0.5, 0.5))
        expect(rays.length).toBe(4)
        expect(rays).toContainEqual(new paper.Point(1, 0))
        expect(rays).toContainEqual(new paper.Point(0, 1))
        expect(rays).toContainEqual(new paper.Point(-1, 0))
        expect(rays).toContainEqual(new paper.Point(0, -1))
    })
    test("throws on invalid vertex", () => {
        expect(() => squareDiagonalsFromVertex(new paper.Point(0.1, 0.1))).toThrow()
    })
})

describe("isIntegerCoordinate", () => {
    test("returns true for integer coordinates", () => {
        expect(isIntegerCoordinate(new paper.Point(1, 2))).toBe(true)
        expect(isIntegerCoordinate(new paper.Point(0, 0))).toBe(true)
        expect(isIntegerCoordinate(new paper.Point(-3, 5))).toBe(true)
    })
    test("returns false for non-integer coordinates", () => {
        expect(isIntegerCoordinate(new paper.Point(1.5, 2))).toBe(false)
        expect(isIntegerCoordinate(new paper.Point(1, 2.5))).toBe(false)
        expect(isIntegerCoordinate(new paper.Point(1.1, 2.9))).toBe(false)
    })
})

describe("isHalfIntegerCoordinate", () => {
    test("returns true for half-integer coordinates", () => {
        expect(isHalfIntegerCoordinate(new paper.Point(0.5, 1.5))).toBe(true)
        expect(isHalfIntegerCoordinate(new paper.Point(2, 3.5))).toBe(true)
        expect(isHalfIntegerCoordinate(new paper.Point(-1.5, 0))).toBe(true)
    })
    test("returns false for non-half-integer coordinates", () => {
        expect(isHalfIntegerCoordinate(new paper.Point(0.25, 1.5))).toBe(false)
        expect(isHalfIntegerCoordinate(new paper.Point(2, 3.1))).toBe(false)
        expect(isHalfIntegerCoordinate(new paper.Point(-1.1, 0))).toBe(false)
    })
})

describe("isOnTetrakisLattice", () => {
    test("returns true for integer coordinates (corners)", () => {
        expect(isOnTetrakisLattice(new paper.Point(0, 0))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(2, 2))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(-3, 5))).toBe(true)
    })
    test("returns true for both coordinates half-integers (centers)", () => {
        expect(isOnTetrakisLattice(new paper.Point(0.5, 1.5))).toBe(true)
        expect(isOnTetrakisLattice(new paper.Point(-1.5, 2.5))).toBe(true)
    })
    test("returns false for edge cases (one integer, one half-integer)", () => {
        expect(isOnTetrakisLattice(new paper.Point(1, 1.5))).toBe(false)
        expect(isOnTetrakisLattice(new paper.Point(0.5, 2))).toBe(false)
    })
    test("returns false for non-half-integer coordinates", () => {
        expect(isOnTetrakisLattice(new paper.Point(0.1, 0.1))).toBe(false)
        expect(isOnTetrakisLattice(new paper.Point(1.25, 1.75))).toBe(false)
    })
})

describe("roundToHalfIntegerCoordinate", () => {
    test("rounds to nearest half-integer coordinate (paper.Point)", () => {
        expect(roundToHalfIntegers(new paper.Point(1, 2))).toEqual(new paper.Point(1, 2))
        expect(roundToHalfIntegers(new paper.Point(0.5, 1.5))).toEqual(new paper.Point(0.5, 1.5))
        expect(roundToHalfIntegers(new paper.Point(1.24, 2.26))).toEqual(new paper.Point(1, 2.5))
        expect(roundToHalfIntegers(new paper.Point(1.24, 2.24))).toEqual(new paper.Point(1, 2))
        expect(roundToHalfIntegers(new paper.Point(-1.26, -2.74))).toEqual(
            new paper.Point(-1.5, -2.5)
        )
    })
})

describe("validFoldCovers", () => {
    test("integer vertex, axis-aligned, even length", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(2, 0))
        expect(covers).toBe(true)
    })
    test("integer vertex, axis-aligned, odd length", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(1, 0))
        expect(covers).toBe(false)
    })
    test("integer vertex, diagonal", () => {
        const covers = areHalfCoversValid(new paper.Point(0, 0), new paper.Point(1, 1))
        expect(covers).toBe(true)
    })
    test("half-integer vertex, axis-aligned, even length", () => {
        const covers = areHalfCoversValid(new paper.Point(0.5, 0.5), new paper.Point(2, 0))
        expect(covers).toBe(true)
    })
    test("half-integer vertex, axis-aligned, odd length", () => {
        const covers = areHalfCoversValid(new paper.Point(0.5, 0.5), new paper.Point(1, 0))
        expect(covers).toBe(false)
    })
    test("half-integer vertex, diagonal", () => {
        const covers = areHalfCoversValid(new paper.Point(0.5, 0.5), new paper.Point(1, 1))
        expect(covers).toBe(true)
    })
    test("throws on invalid vertex", () => {
        expect(() => areHalfCoversValid(new paper.Point(0.1, 0.1), new paper.Point(1, 0))).toThrow()
    })
})
