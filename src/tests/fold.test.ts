import { describe, it, expect } from "vitest"
import paper from "paper"
import { FOLD_COVER, FoldSpec } from "../lib/fold"

describe("FoldSpec", () => {
    describe("fromEndPoints", () => {
        it("creates a FoldSpec from valid endpoints", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(1, 1)
            const fold = FoldSpec.fromEndPoints(start, end)
            expect(fold.hinges[0]).toBePaperPoint(new paper.Point(1, 0))
            expect(fold.hinges[1]).toBePaperPoint(new paper.Point(0, 1))
        })

        it("throws if endpoints are not on the lattice", () => {
            expect(() =>
                FoldSpec.fromEndPoints(new paper.Point(0.1, 0), new paper.Point(2, 0))
            ).toThrow()
            expect(() =>
                FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2.1, 0))
            ).toThrow()
        })

        it("throws if endpoints are equal", () => {
            expect(() =>
                FoldSpec.fromEndPoints(new paper.Point(1, 1), new paper.Point(1, 1))
            ).toThrow()
        })

        it("creates a FoldSpec with foldCover = Full (default)", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(1, 1)
            const fold = FoldSpec.fromEndPoints(start, end, FOLD_COVER.Full)
            expect(fold.hinges[0]).toBePaperPoint(new paper.Point(1, 0))
            expect(fold.hinges[1]).toBePaperPoint(new paper.Point(0, 1))
        })

        it("creates a FoldSpec with foldCover = Left", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(1, 1)
            const fold = FoldSpec.fromEndPoints(start, end, FOLD_COVER.Left)
            expect(fold.hinges[0]).toBePaperPoint(new paper.Point(1, 0))
            expect(fold.hinges[1]).toBePaperPoint(new paper.Point(0.5, 0.5))
        })

        it("creates a FoldSpec with foldCover = Right", () => {
            const start = new paper.Point(0, 0)
            const end = new paper.Point(1, 1)
            const fold = FoldSpec.fromEndPoints(start, end, FOLD_COVER.Right)
            expect(fold.hinges[0]).toBePaperPoint(new paper.Point(0.5, 0.5))
            expect(fold.hinges[1]).toBePaperPoint(new paper.Point(0, 1))
        })
    })

    describe("toTriangles", () => {
        it("returns two triangles with correct points", () => {
            const fold = FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2, 0))
            const { near, far } = fold.toTriangles()
            expect(near.area).above(0)
            expect(far.area).above(0)
            expect(near.segments.length).toBe(3)
            expect(far.segments.length).toBe(3)
            // Check that the triangles share the hinge points
            expect(near.segments[1].point.equals(far.segments[2].point)).toBe(true)
            expect(near.segments[2].point.equals(far.segments[1].point)).toBe(true)
        })
    })

    describe("toQuad", () => {
        it("returns a closed quad with correct points", () => {
            const fold = FoldSpec.fromEndPoints(new paper.Point(0, 0), new paper.Point(2, 0))
            const quad = fold.toQuad()
            expect(quad.area).above(0)
            expect(quad.segments.length).toBe(4)
            expect(quad.closed).toBe(true)
            // Check that the quad contains all four points
            const points = [fold.start, fold.hinges[0], fold.end, fold.hinges[1]]
            for (let i = 0; i < 4; ++i) {
                expect(quad.segments[i].point.equals(points[i])).toBe(true)
            }
        })
    })
})
