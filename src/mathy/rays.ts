/**
 * Calculates the squared length of a paper.Point (magnitude squared).
 * @param point - The point to calculate the squared length for.
 * @returns The squared length of the point.
 */
export function lengthSquared(point: paper.Point): number {
    return point.x * point.x + point.y * point.y
}

/**
 * Calculates the squared distance from a given point to a ray originating from the origin.
 * @param ray - The direction of the ray as a paper.Point (direction vector).
 * @param point - The point for which the distance is calculated as a paper.Point.
 * @returns The squared distance from the point to the ray.
 */
export function distanceToRaySquared(ray: paper.Point, point: paper.Point): number {
    // Normalize the ray direction vector
    const normalizedRay = ray.normalize()

    // Project the point onto the normalized ray
    const dotProduct = point.dot(normalizedRay)

    // If the projection is behind the origin, use the distance to the origin
    if (dotProduct <= 0) {
        return lengthSquared(point)
    }

    // Compute the projected point on the normalized ray
    const projectedPoint = normalizedRay.multiply(dotProduct)

    // Compute the distance from the point to the projected point
    const distanceVector = point.subtract(projectedPoint)
    return lengthSquared(distanceVector)
}

/**
 * Selects the nearest ray from a list of rays to a given point.
 * @param rays - An array of rays represented as direction vectors (paper.Point).
 * @param point - The point to compare against the rays (paper.Point).
 * @returns The index of the nearest ray.
 */
export function selectNearestRay(rays: paper.Point[], point: paper.Point): number {
    let nearestRayIndex = -1
    let minDistanceSquared = Infinity

    rays.forEach((ray, index) => {
        const distanceSquared = distanceToRaySquared(ray, point)
        if (distanceSquared < minDistanceSquared) {
            minDistanceSquared = distanceSquared
            nearestRayIndex = index
        }
    })

    return nearestRayIndex
}
