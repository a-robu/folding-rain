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

export function defineUnfoldFromBg(start: paper.Point, requestedEnd: paper.Point) {
    let delta = requestedEnd.subtract(start)
    let end = requestedEnd.clone()
    let hingeCorners: paper.Point[] = []

    if (delta.length < 0.5) {
        throw new Error("Invalid line, length is too small")
    }
    if (Math.abs(delta.x) > 0 && Math.abs(delta.y) > 0) {
        if (Math.abs(delta.x) != Math.abs(delta.y)) {
            throw new Error("Diagonal line is not 45 degrees")
        }
        // Diagonal line case
        hingeCorners = [
            new paper.Point(end.x, start.y),
            new paper.Point(start.x, end.y)
        ]
    }
    else if (Math.abs(delta.y) < 0.01) {
        // Horizontal line case
        end.x += delta.x % 2
        delta = end.subtract(start)
        hingeCorners = [
            new paper.Point(start.x + delta.x / 2, start.y + delta.x / 2),
            new paper.Point(start.x + delta.x / 2, start.y - delta.x / 2),
        ]
    }
    else if (Math.abs(delta.x) < 0.01) {
        // Vertical line case
        // Reflect the problem by swapping x and y
        const reflectedResult = defineUnfoldFromBg(
            new paper.Point(start.y, start.x), new paper.Point(end.y, end.x))

        // Flip the result back by swapping x and y again
        hingeCorners = reflectedResult.hinges.map(p => new paper.Point(p.y, p.x))
        end = new paper.Point(reflectedResult.end.y, reflectedResult.end.x)
    }
    return {
        start: start,
        hinges: hingeCorners,
        end: end
    }
}