import paper from "paper"

function getMainDiagonalFillLines(bounds: paper.Rectangle): [paper.Point, paper.Point][] {
    const lines: [paper.Point, paper.Point][] = []

    function detectIntercept(x0: number, y0: number): paper.Point {
        const tToRight = bounds.right - x0
        const tToBottom = bounds.bottom - y0
        const t = Math.min(tToRight, tToBottom)
        return new paper.Point(x0 + t, y0 + t)
    }

    // Stage 1: walk up the left edge (x = bounds.left), from bottom to top
    for (let y0 = bounds.top + 1; y0 < bounds.bottom; y0++) {
        lines.push([new paper.Point(bounds.left, y0), detectIntercept(bounds.left, y0)])
    }

    // Stage 2: walk right along top edge (y = bounds.top), from left to right
    for (let x0 = bounds.left; x0 < bounds.right; x0++) {
        lines.push([new paper.Point(x0, bounds.top), detectIntercept(x0, bounds.top)])
    }

    return lines
}

function getReverseDiagonalFillLines(bounds: paper.Rectangle): [paper.Point, paper.Point][] {
    // Swap width and height, and also swap x and y origins
    const swappedBounds = new paper.Rectangle(bounds.y, bounds.x, bounds.height, bounds.width)
    const rawLines = getMainDiagonalFillLines(swappedBounds)
    return rawLines.map(
        points =>
            points.map(point =>
                point
                    .rotate(90, new paper.Point(0, 0))
                    .add(new paper.Point(bounds.right, bounds.top - bounds.left))
            ) as [paper.Point, paper.Point]
    )
}

function getGridDiagonals(bounds: paper.Rectangle): [paper.Point, paper.Point][] {
    return getMainDiagonalFillLines(bounds).concat(getReverseDiagonalFillLines(bounds))
}

const GRID_LINES_COLOR = new paper.Color(0.95, 0.95, 0.95)
// const GRID_LINES_COLOR = new paper.Color(0, 0, 0)
const GRID_LINES_WIDTH = 0.05
const GRID_DOTS_COLOR = new paper.Color(0.8, 0.8, 0.8)
// const GRID_DOTS_COLOR = new paper.Color(0, 0, 0)
const GRID_DOTS_RADIUS = 0.065

export function drawGrid(layer: paper.Layer, bounds: paper.Rectangle) {
    let lines: [paper.Point, paper.Point][] = []
    // Horizontal lines
    for (let y = bounds.y; y <= bounds.bottom; y++) {
        lines.push([new paper.Point(0, y), new paper.Point(bounds.right, y)])
    }
    // Vertical lines
    for (let x = bounds.x; x <= bounds.right; x++) {
        lines.push([new paper.Point(x, bounds.y), new paper.Point(x, bounds.bottom)])
    }
    // Diagonal lines
    for (let line of getGridDiagonals(bounds)) {
        lines.push(line)
    }
    // Draw the lines
    for (let line of lines) {
        let path = new paper.Path()
        path.moveTo(line[0])
        path.lineTo(line[1])
        path.strokeColor = GRID_LINES_COLOR
        path.strokeWidth = GRID_LINES_WIDTH
        layer.addChild(path)
    }
    // Square corner dots
    for (let x = bounds.left; x <= bounds.right; x++) {
        for (let y = bounds.top; y <= bounds.bottom; y++) {
            let gridPoint = new paper.Point(x, y)
            let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
            path.fillColor = GRID_DOTS_COLOR
            layer.addChild(path)
        }
    }
    // Square center dots
    for (let x = bounds.left; x < bounds.right; x++) {
        for (let y = bounds.top; y < bounds.bottom; y++) {
            let gridPoint = new paper.Point(x + 0.5, y + 0.5)
            let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
            path.fillColor = GRID_DOTS_COLOR
            layer.addChild(path)
        }
    }
}
