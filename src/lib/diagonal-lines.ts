import paper from "paper"

function getMainDiagonalFillLines(w: number, h: number): [paper.Point, paper.Point][] {
    const lines: [paper.Point, paper.Point][] = []

    function detectIntercept(x0: number, y0: number): paper.Point {
        const tToRight = w - x0
        const tToBottom = h - y0
        const t = Math.min(tToRight, tToBottom)
        return new paper.Point(x0 + t, y0 + t)
    }

    // Stage 1: walk up the left edge (x = 0), from bottom to top
    for (let y0 = 1; y0 < h; y0++) {
        lines.push([new paper.Point(0, y0), detectIntercept(0, y0)])
    }

    // Stage 2: walk right along top edge (y = 0), from left to right
    for (let x0 = 0; x0 < w; x0++) {
        lines.push([new paper.Point(x0, 0), detectIntercept(x0, 0)])
    }

    return lines
}

function getReverseDiagonalFillLines(w: number, h: number): [paper.Point, paper.Point][] {
    const rawLines = getMainDiagonalFillLines(h, w) // note: swapped
    return rawLines.map(
        points => points.map(
            point => point.rotate(90, new paper.Point(0, 0)).add(new paper.Point(w, 0))) as [paper.Point, paper.Point])
}

export function getGridDiagonals(width: number, height: number): [paper.Point, paper.Point][] {
    return getMainDiagonalFillLines(width, height)
        .concat(getReverseDiagonalFillLines(width, height))
}