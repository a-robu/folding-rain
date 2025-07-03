import paper from "paper"
import { randomGridPolygon } from "../random-grid-polygon"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"
import { XORShift } from "random-seedable"

export default {
    title: "Random Grid Polygon"
}

function makePolygonStory(seed: number) {
    return withCommonArgs(function showRandomPolygon(args: CommonStoryArgs) {
        let bounds = new paper.Rectangle(0, 0, 10, 10)
        let { container, annotationsLayer } = rigamarole({
            bounds,
            zoom: 40,
            ...args
        })
        // Draw grid for reference
        for (let x = 0; x <= 10; x++) {
            let vline = new paper.Path([new paper.Point(x, 0), new paper.Point(x, 10)])
            vline.strokeColor = new paper.Color("#eee")
            annotationsLayer.addChild(vline)
        }
        for (let y = 0; y <= 10; y++) {
            let hline = new paper.Path([new paper.Point(0, y), new paper.Point(10, y)])
            hline.strokeColor = new paper.Color("#eee")
            annotationsLayer.addChild(hline)
        }
        let poly = randomGridPolygon(bounds, new XORShift(seed))
        poly.strokeColor = new paper.Color("#0074D9")
        poly.strokeWidth = 0.15
        poly.fillColor = new paper.Color(0.7, 0.85, 1, 0.3)
        annotationsLayer.addChild(poly)
        return container
    })
}

export const polygonSeed1 = makePolygonStory(1)
export const polygonSeed2 = makePolygonStory(2)
export const polygonSeed3 = makePolygonStory(3)
export const polygonSeed4 = makePolygonStory(4)
export const polygonSeed5 = makePolygonStory(5)
