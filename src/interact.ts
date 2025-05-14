import paper from "paper"

export function snapToDiagonalOrAALine(start: paper.Point, end: paper.Point): paper.Point {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // We don't need to snap to the diagonal of one of the lines is
    // twice as long as the other, so let's do that case first.

    if (Math.abs(dx) > Math.abs(dy) * 2) {
        // Snap to horizontal line
        return new paper.Point(end.x, start.y)
    }
    if (Math.abs(dy) > Math.abs(dx) * 2) {
        // Snap to vertical line
        return new paper.Point(start.x, end.y)
    }

    // Determine the unit vector of the new 45-degree line
    let diagDirection = new paper.Point(dx > 0 ? 1 : -1, dy > 0 ? 1 : -1).normalize()
    const diagLength = Math.sqrt(dx * dx + dy * dy)
    return diagDirection.multiply(diagLength).add(start).round()
}

export type UnfoldPlan = {
    start: paper.Point
    hinges: [paper.Point, paper.Point]
    end: paper.Point
}

export function defineUnfoldFromBg(start: paper.Point, end: paper.Point): UnfoldPlan {
    // We assume the input defines a valid (lattice-aligned) square.
    // So we just add the other two corners.
    let vector = end.subtract(start)
    let midpoint = start.add(vector.multiply(0.5))
    return {
        start: start,
        hinges: [
            midpoint.add(vector.multiply(0.5).rotate(90, new paper.Point(0, 0))),
            midpoint.add(vector.multiply(0.5).rotate(-90, new paper.Point(0, 0)))
        ],
        end: end
    }
}

export function unfoldPlanToPath(plan: UnfoldPlan): paper.Path {
    let newPolygon = new paper.Path()
    newPolygon.add(plan.start)
    newPolygon.add(plan.hinges[0])
    newPolygon.add(plan.end)
    newPolygon.add(plan.hinges[1])
    newPolygon.closed = true
    return newPolygon
}
