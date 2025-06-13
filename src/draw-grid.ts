import paper from "paper"

function getMainDiagonalFillLines(bounds: paper.Rectangle): [paper.Point, paper.Point][] {
    const lines: [paper.Point, paper.Point][] = []
    // Only generate diagonals if both width and height are >= 1
    if (bounds.width < 1 || bounds.height < 1) return lines
    // Special case: 1x1 grid, only one main diagonal
    if (bounds.width === 1 && bounds.height === 1) {
        lines.push([
            new paper.Point(bounds.left, bounds.top),
            new paper.Point(bounds.right, bounds.bottom)
        ])
        return lines
    }
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
    const lines: [paper.Point, paper.Point][] = []
    // Only generate diagonals if both width and height are >= 1
    if (bounds.width < 1 || bounds.height < 1) return lines
    function detectIntercept(x0: number, y0: number): paper.Point {
        const tToLeft = x0 - bounds.left
        const tToBottom = bounds.bottom - y0
        const t = Math.min(tToLeft, tToBottom)
        return new paper.Point(x0 - t, y0 + t)
    }
    // Stage 1: walk up the right edge (x = bounds.right), from bottom to top
    for (let y0 = bounds.top + 1; y0 < bounds.bottom; y0++) {
        lines.push([new paper.Point(bounds.right, y0), detectIntercept(bounds.right, y0)])
    }
    // Stage 2: walk left along top edge (y = bounds.top), from right to left
    for (let x0 = bounds.right; x0 > bounds.left; x0--) {
        lines.push([new paper.Point(x0, bounds.top), detectIntercept(x0, bounds.top)])
    }
    return lines
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
    // Normalize bounds for iteration
    const xMin = Math.min(bounds.left, bounds.right)
    const xMax = Math.max(bounds.left, bounds.right)
    const yMin = Math.min(bounds.top, bounds.bottom)
    const yMax = Math.max(bounds.top, bounds.bottom)
    // Horizontal lines
    for (let y = yMin; y <= yMax; y++) {
        lines.push([new paper.Point(xMin, y), new paper.Point(xMax, y)])
    }
    // Vertical lines
    for (let x = xMin; x <= xMax; x++) {
        lines.push([new paper.Point(x, yMin), new paper.Point(x, yMax)])
    }
    // Diagonal lines
    // Always generate diagonals for normalized bounds, then map to original orientation
    const normBounds = new paper.Rectangle(xMin, yMin, xMax - xMin, yMax - yMin)
    let diagonalLines = getGridDiagonals(normBounds)
    // If bounds are flipped, flip the diagonal lines accordingly
    const flipX = bounds.left > bounds.right
    const flipY = bounds.top > bounds.bottom
    function flipPoint(pt: paper.Point): paper.Point {
        let x = pt.x,
            y = pt.y
        if (flipX) x = xMax - (x - xMin)
        if (flipY) y = yMax - (y - yMin)
        return new paper.Point(x, y)
    }
    for (let line of diagonalLines) {
        lines.push([flipPoint(line[0]), flipPoint(line[1])])
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
    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            let px = flipX ? xMax - (x - xMin) : x
            let py = flipY ? yMax - (y - yMin) : y
            let gridPoint = new paper.Point(px, py)
            let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
            path.fillColor = GRID_DOTS_COLOR
            layer.addChild(path)
        }
    }
    // Square center dots
    for (let x = xMin; x < xMax; x++) {
        for (let y = yMin; y < yMax; y++) {
            let px = flipX ? xMax - (x - xMin) - 0.5 : x + 0.5
            let py = flipY ? yMax - (y - yMin) - 0.5 : y + 0.5
            let gridPoint = new paper.Point(px, py)
            let path = new paper.Path.Circle(gridPoint, GRID_DOTS_RADIUS)
            path.fillColor = GRID_DOTS_COLOR
            layer.addChild(path)
        }
    }
}
