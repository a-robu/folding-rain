/**
 * Computes the clockwise angle between two vectors in degrees. To compute
 * the inner angle of a clockwise polygon, pass the vectors in opposite order.
 * Uhm but only if you imagine putting the vectors tail-to-tail.
 */
export function angleBetweenVectors(a: paper.Point, b: paper.Point): number {
    // If either vector is zero, return 0
    if (a.length === 0 || b.length === 0) return 0
    // Get angles in radians
    const thetaA = Math.atan2(a.y, a.x)
    const thetaB = Math.atan2(b.y, b.x)
    // Compute difference (b relative to a)
    let diff = thetaB - thetaA
    // Convert to degrees
    let deg = (diff * 180) / Math.PI
    // Normalize to [0, 360)
    deg = ((deg % 360) + 360) % 360
    // Return the directed angle in [0, 360)
    return Number(deg.toFixed(10))
}

/**
 * Discretizes an angle to the nearest multiple of 45 degrees.
 * Throws an error if the angle is not a multiple of 45.
 * @param angle Angle in degrees
 * @returns Discretized angle in degrees
 */
export function discretizeAngle(angle: number): number {
    let integerized = angle / 45
    // Use distance to nearest integer for floating point tolerance
    if (Math.abs(Math.round(integerized) - integerized) > 0.001) {
        throw new Error(`Angle ${angle} is not a multiple of 45 degrees (${angle})`)
    }
    return Math.round(integerized) * 45
}

export function getSegmentAngle(segment: paper.Segment): number {
    return discretizeAngle(
        angleBetweenVectors(
            segment.next.point.subtract(segment.point),
            segment.previous.point.subtract(segment.point)
        )
    )
}
