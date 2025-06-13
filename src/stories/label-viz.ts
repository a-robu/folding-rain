import paper from "paper"
import type { AnimatedBoard } from "@/animated-board"

export class LabelViz {
    private labels: paper.PointText[] = []
    private circles: paper.Path.Circle[] = []
    private annotationsLayer: paper.Layer
    private animatedBoard: AnimatedBoard

    constructor(annotationsLayer: paper.Layer, animatedBoard: AnimatedBoard) {
        this.annotationsLayer = annotationsLayer
        this.animatedBoard = animatedBoard
        this.animatedBoard.addShapeUpdateListener(this.onShapeUpdate.bind(this))
        this.onShapeUpdate()
    }

    private clearLabels() {
        for (const label of this.labels) {
            label.remove()
        }
        this.labels = []
        for (const circle of this.circles) {
            circle.remove()
        }
        this.circles = []
    }

    private onShapeUpdate() {
        this.clearLabels()
        let i = 1
        for (const shape of this.animatedBoard.shapes.values()) {
            // Place label at shape's centroid
            const centroid = shape.position
            // Add circle behind the label
            const circle = new paper.Path.Circle({
                center: centroid.add(new paper.Point(0, 0)),
                radius: 0.18,
                fillColor: "white",
                strokeColor: "black",
                strokeWidth: 0.03
            })
            this.annotationsLayer.addChild(circle)
            this.circles.push(circle)
            const label = new paper.PointText({
                content: i,
                point: centroid.add(new paper.Point(0, 0.07)),
                fillColor: "black",
                fontSize: 0.26,
                justification: "center",
                fontFamily: "Courier New"
            })
            this.annotationsLayer.addChild(label)
            this.labels.push(label)
            i++
        }
    }
}
