import paper from "paper"
import { ProceduralAnimation } from "../spontaneous"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"

export default {
    title: "Random Grid Polygon/Procedural Animation"
}

export const tryAddRandomShapeDemo = withCommonArgs(function tryAddRandomShapeDemo(
    args: CommonStoryArgs
) {
    let bounds = new paper.Rectangle(0, 0, 10, 10)
    let { container, board } = rigamarole({
        bounds,
        zoom: 40,
        ...args
    })
    // Call tryAddRandomShape several times
    const anim = new ProceduralAnimation(board, bounds, 123)
    for (let i = 0; i < 5; i++) {
        anim.tryAddRandomShape()
    }
    // // Draw grid for reference
    // for (let x = 0; x <= 10; x++) {
    //     let vline = new paper.Path([new paper.Point(x, 0), new paper.Point(x, 10)])
    //     vline.strokeColor = new paper.Color("#eee")
    //     annotationsLayer.addChild(vline)
    // }
    // for (let y = 0; y <= 10; y++) {
    //     let hline = new paper.Path([new paper.Point(0, y), new paper.Point(10, y)])
    //     hline.strokeColor = new paper.Color("#eee")
    //     annotationsLayer.addChild(hline)
    // }
    return container
})
