import { describe, expect, test } from "vitest"
import * as matchers from "jest-extended"
expect.extend(matchers)
import paper from "paper"
import { Fold } from "@/lib/fold"

describe("Fold", () => {
    describe("fromEndPoints", () => {
        test.each([
            [0, 0, 1, 1, 1, 0, 0, 1], // end points on square corners
            [0.5, 0.5, 1.5, 0.5, 1, 0, 1, 1] // end points on square midpoints
        ])(
            "given (%f,%f) and (%f, %f), returns hinges (%f,%f) and (%f, %f)",
            (x1, y1, x2, y2, hingeX1, hingeY1, hingeX2, hingeY2) => {
                let fold = Fold.fromEndPoints(new paper.Point(x1, y1), new paper.Point(x2, y2))
                expect(fold.start).toEqual(new paper.Point(x1, y1))
                expect(fold.end).toEqual(new paper.Point(x2, y2))
                expect(fold.hinges).toHaveLength(2)
                expect(fold.hinges).toIncludeSameMembers([
                    new paper.Point(hingeX1, hingeY1),
                    new paper.Point(hingeX2, hingeY2)
                ])
            }
        )
    })
})
