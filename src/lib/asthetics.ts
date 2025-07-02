import { getSegmentAngle } from "@/lib/vec"

function getWindiness(shape: paper.Path): number {
    let totalWindiness = 0
    for (let i = 0; i < shape.segments.length; i++) {
        totalWindiness += Math.abs(getSegmentAngle(shape.segments[i]))
    }
    return totalWindiness / shape.segments.length
}
