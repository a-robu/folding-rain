// Utility to generate a random axis-aligned or 45-degree diagonal polygon
// with integer coordinates, within the given bounds.
import paper from "paper"
import type PRNG from "random-seedable/@types/PRNG"

function cross(o: paper.Point, a: paper.Point, b: paper.Point) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function polygonArea(points: paper.Point[]): number {
    let area = 0
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length
        area += points[i].x * points[j].y - points[j].x * points[i].y
    }
    return area / 2
}

export function randomGridPolygon(bounds: paper.Rectangle, random: PRNG): paper.Path {
    // console.log(`🏗️ randomGridPolygon: Starting generation with bounds`, bounds)

    // 1. Randomly sample N grid points
    const minX = Math.ceil(bounds.left)
    const maxX = Math.floor(bounds.right)
    const minY = Math.ceil(bounds.top)
    const maxY = Math.floor(bounds.bottom)
    const nPoints = random.randRange(5, 10)

    // console.log(`📊 Grid bounds: x=[${minX}, ${maxX}], y=[${minY}, ${maxY}]`)
    // console.log(`🎯 Target points count: ${nPoints}`)

    const points: paper.Point[] = []
    const used = new Set<string>()
    let tries = 0
    while (points.length < nPoints && tries < nPoints * 10) {
        const x = random.randRange(minX, maxX)
        const y = random.randRange(minY, maxY)
        const key = `${x},${y}`
        if (!used.has(key)) {
            points.push(new paper.Point(x, y))
            used.add(key)
        }
        tries++
    }

    // console.log(`📍 Generated ${points.length} unique points after ${tries} tries`)
    // console.log(`📍 Points:`, points.map(p => `(${p.x}, ${p.y})`))

    if (points.length < 3) {
        // fallback: make a triangle
        // console.log(`⚠️ Not enough points, using fallback triangle`)
        points.length = 0
        points.push(
            new paper.Point(minX, minY),
            new paper.Point(maxX, minY),
            new paper.Point(minX, maxY)
        )
        // console.log(`📍 Fallback triangle points:`, points.map(p => `(${p.x}, ${p.y})`))
    }
    // 2. Compute convex hull (Andrew's monotone chain)
    points.sort((a, b) => a.x - b.x || a.y - b.y)
    const lower: paper.Point[] = []
    for (const p of points) {
        while (
            lower.length >= 2 &&
            cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
        ) {
            lower.pop()
        }
        lower.push(p)
    }
    const upper: paper.Point[] = []
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i]
        while (
            upper.length >= 2 &&
            cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
        ) {
            upper.pop()
        }
        upper.push(p)
    }
    let hull = lower.slice(0, lower.length - 1).concat(upper.slice(0, upper.length - 1))
    // console.log(`🔄 Convex hull before filtering:`, hull.map(p => `(${p.x}, ${p.y})`))

    // Remove duplicates
    hull = hull.filter((p, i, arr) => i === 0 || !p.equals(arr[i - 1]))
    // console.log(`🔄 Convex hull after removing duplicates:`, hull.map(p => `(${p.x}, ${p.y})`))

    // 3. Ensure clockwise order
    const area = polygonArea(hull)
    // console.log(`📐 Polygon area: ${area} (${area < 0 ? 'counter-clockwise' : 'clockwise'})`)

    if (area < 0) {
        hull.reverse()
        // console.log(`🔄 Reversed to clockwise:`, hull.map(p => `(${p.x}, ${p.y})`))
    }
    // 4. Post-process: break any non-axis/diagonal edge into valid steps
    function isValidEdge(a: paper.Point, b: paper.Point) {
        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)
        return (dx === 0 && dy > 0) || (dy === 0 && dx > 0) || (dx === dy && dx > 0)
    }
    const snapped: paper.Point[] = []
    for (let i = 0; i < hull.length; i++) {
        const a = hull[i]
        const b = hull[(i + 1) % hull.length]
        snapped.push(a)
        let curr = a
        while (!curr.equals(b) && !isValidEdge(curr, b)) {
            // Step towards b using only axis/diagonal moves
            let dx = b.x - curr.x
            let dy = b.y - curr.y
            let stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1
            let stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1
            // Prefer diagonal if possible
            if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
                curr = new paper.Point(curr.x + stepX, curr.y + stepY)
            } else if (Math.abs(dx) > 0) {
                curr = new paper.Point(curr.x + stepX, curr.y)
            } else {
                curr = new paper.Point(curr.x, curr.y + stepY)
            }
            // Avoid duplicating b
            if (!curr.equals(b)) {
                snapped.push(curr)
            }
        }
    }
    // Remove consecutive duplicates
    const final = snapped.filter((p, i, arr) => i === 0 || !p.equals(arr[i - 1]))

    // console.log(`🏁 Final polygon points:`, final.map(p => `(${p.x}, ${p.y})`))
    // console.log(`🏁 Final polygon segments count: ${final.length}`)

    const result = new paper.Path({ segments: final, closed: true })
    // console.log(`✅ randomGridPolygon: Generated polygon successfully`)

    return result
}
