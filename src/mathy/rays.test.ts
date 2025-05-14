import { describe, it, expect } from "vitest"
import { selectNearestRay, distanceToRaySquared, lengthSquared } from "./rays"
import paper from "paper"

describe("lengthSquared", () => {
    it("should return the squared length of a point", () => {
        const point = new paper.Point(3, 4)
        const squaredLength = lengthSquared(point)
        expect(squaredLength).toBe(25) // 3^2 + 4^2 = 25
    })
})

describe("distanceToRaySquared", () => {
    it("should return the squared distance to the ray when the point is on the ray", () => {
        const ray = new paper.Point(1, 0)
        const point = new paper.Point(2, 0)
        const distance = distanceToRaySquared(ray, point)
        expect(distance).toBe(0) // Point is on the ray
    })

    it("should return the squared distance to the ray when the point is off the ray", () => {
        const ray = new paper.Point(1, 0)
        const point = new paper.Point(2, 1)
        const distance = distanceToRaySquared(ray, point)
        expect(distance).toBe(1) // Distance is 1 unit squared
    })

    it("should return the squared distance to the origin when the projection is behind the origin", () => {
        const ray = new paper.Point(1, 0)
        const point = new paper.Point(-1, 1)
        const distance = distanceToRaySquared(ray, point)
        expect(distance).toBe(2) // Distance to the origin is √2, squared = 2
    })
})

describe("selectNearestRay", () => {
    it("should select the nearest ray to the given point", () => {
        const rays = [new paper.Point(1, 0), new paper.Point(0, 1)]
        const point = new paper.Point(0.1, 0.9)
        const nearestRayIndex = selectNearestRay(rays, point)
        expect(nearestRayIndex).toBe(1)
    })

    it("should return -1 when no rays are provided", () => {
        const rays: paper.Point[] = []
        const point = new paper.Point(1, 1)
        const nearestRayIndex = selectNearestRay(rays, point)
        expect(nearestRayIndex).toBe(-1) // No rays present
    })

    it("should handle a single ray correctly", () => {
        const rays = [new paper.Point(1, 0)]
        const point = new paper.Point(2, 1)
        const nearestRayIndex = selectNearestRay(rays, point)
        expect(nearestRayIndex).toBe(0) // Only one ray, it must be the nearest
    })

    it("should select the first ray when both are equidistant", () => {
        const rays = [new paper.Point(1, 0), new paper.Point(0, 1)]
        const point = new paper.Point(1, 1)
        const nearestRayIndex = selectNearestRay(rays, point)
        expect(nearestRayIndex).toBe(0) // Both rays are equidistant, select the first one
    })
})
