import paper from "paper"
import { FOLD_ACTION, FoldSpec } from "@/lib/fold"
import { rigamarole } from "./rigamarole"
import { sleep } from "@/lib/time"
import { LabelViz } from "./label-viz"

export default {
    title: "Checks",
    argTypes: {
        drawGridLines: { control: "boolean", defaultValue: true },
        contactViz: { control: "boolean", defaultValue: false },
        showLabels: { control: "boolean", defaultValue: false }
    }
}

export function latticeTrianglesAndPoints(args: {
    drawGridLines: boolean
    contactViz: boolean
    showLabels: boolean
}) {
    let bounds = new paper.Rectangle(0, 0, 5, 5)
    let { container, animatedBoard, annotationsLayer } = rigamarole({
        bounds,
        zoom: 70,
        drawGridLines: args.drawGridLines,
        contactViz: args.contactViz
    })
    if (args.showLabels) {
        new LabelViz(annotationsLayer, animatedBoard)
    }
    async function animate() {
        await sleep(300)
        await animatedBoard.fold(
            1,
            FoldSpec.fromEndPoints(new paper.Point(1, 1), new paper.Point(3, 3)),
            FOLD_ACTION.Create
        )
    }
    animate()

    return container
}
latticeTrianglesAndPoints.args = { drawGridLines: true, contactViz: false, showLabels: false }
