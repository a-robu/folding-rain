import paper from "paper"
import { roundVertexToHalfIntegers } from "./lib/integers"

export type UnfoldPlan = {
    start: paper.Point
    hinges: [paper.Point, paper.Point]
    end: paper.Point
}

export function createUnfoldPlan(start: paper.Point, end: paper.Point): UnfoldPlan {
    // We assume the input defines a valid (lattice-aligned) square.
    // So we just add the other two corners.
    let vector = end.subtract(start)
    let midpoint = start.add(vector.multiply(0.5))
    return {
        start: start,
        hinges: [
            roundVertexToHalfIntegers(
                midpoint.add(vector.multiply(0.5).rotate(90, new paper.Point(0, 0)))
            ),
            roundVertexToHalfIntegers(
                midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
            )
        ],
        end: end
    }
}

export function transposeUnfoldPlan(plan: UnfoldPlan): UnfoldPlan {
    return {
        start: plan.hinges[0],
        hinges: [plan.start, plan.end],
        end: plan.hinges[1]
    }
}

export function reverseUnfoldPlan(plan: UnfoldPlan): UnfoldPlan {
    return {
        start: plan.end,
        hinges: plan.hinges,
        end: plan.start
    }
}

export function unfoldPlanToTrangles(plan: UnfoldPlan): [paper.Path, paper.Path] {
    let flap1 = new paper.Path()
    flap1.add(plan.start)
    flap1.add(plan.hinges[0])
    flap1.add(plan.hinges[1])
    flap1.closed = true
    let flap2 = new paper.Path()
    flap2.add(plan.hinges[0])
    flap2.add(plan.hinges[1])
    flap2.add(plan.end)
    flap2.closed = true
    return [flap1, flap2]
}

export function makePathFromUnfoldPlan(plan: UnfoldPlan): paper.Path {
    let newPolygon = new paper.Path()
    newPolygon.add(plan.start)
    newPolygon.add(plan.hinges[0])
    newPolygon.add(plan.end)
    newPolygon.add(plan.hinges[1])
    newPolygon.closed = true
    return newPolygon
}
