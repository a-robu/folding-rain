import type { AnimatedBoard } from "@/animated-board"
import { allTriangleIdxs, allVertices, makeTrianglePolygon, triangleIdxToKey } from "@/lib/tetrakis"
import paper from "paper"

export class ContactViz {
    private latticeVizTriangles: Map<string, paper.Path> = new Map()
    private triangleLabels: Map<string, paper.PointText> = new Map()
    private latticeVizPoints: { point: paper.Point; circle: paper.Path.Circle }[] = []
    private GREEN = new paper.Color(0, 1, 0, 0.5)
    private ORANGE = new paper.Color(1, 0.5, 0, 0.5)
    private animatedBoard: any

    constructor(
        bounds: paper.Rectangle,
        annotationsLayer: paper.Layer,
        animatedBoard: AnimatedBoard
    ) {
        this.animatedBoard = animatedBoard
        // Triangles
        for (let tx of allTriangleIdxs(bounds)) {
            let triangle = makeTrianglePolygon(tx)
            triangle.visible = false
            annotationsLayer.addChild(triangle)
            this.latticeVizTriangles.set(triangleIdxToKey(tx), triangle)
        }

        for (let tx of allTriangleIdxs(bounds)) {
            let label = new paper.PointText({
                content: "1",
                point: makeTrianglePolygon(tx).bounds.center.add(new paper.Point(0, 0.04)),
                fontSize: 0.16,
                justification: "center"
            })
            annotationsLayer.addChild(label)
            this.triangleLabels.set(triangleIdxToKey(tx), label)
        }

        // Points
        for (let vertex of allVertices(bounds)) {
            let circle = new paper.Path.Circle(vertex, 0.1)
            circle.visible = false
            annotationsLayer.addChild(circle)
            this.latticeVizPoints.push({ point: vertex, circle })
        }

        this.animatedBoard.onShapeUpdate = this.onShapeUpdate.bind(this)
        this.onShapeUpdate()
    }

    onShapeUpdate() {
        for (let [key, triangle] of this.latticeVizTriangles) {
            let contacts = this.animatedBoard.findPolygonContacts(triangle)
            if (contacts.shapeIds.length > 0) {
                triangle.visible = false
            } else if (contacts.lockShapeIds.length > 0) {
                triangle.fillColor = this.ORANGE
                triangle.visible = true
            } else {
                triangle.fillColor = this.GREEN
                triangle.visible = true
            }
            let label = this.triangleLabels.get(key)
            if (contacts.lockShapeIds.length == 0 && contacts.shapeIds.length == 0) {
                label!.content = ""
            } else if (contacts.shapeIds.length > 0 && contacts.lockShapeIds.length == 0) {
                label!.content = `${contacts.shapeIds}`
            } else {
                label!.content = `${contacts.shapeIds}/${contacts.lockShapeIds}`
            }
        }
        for (let { point, circle } of this.latticeVizPoints) {
            let contacts = this.animatedBoard.findPointContacts(point)
            if (contacts.shapeIds.length > 0) {
                circle.visible = false
            } else if (contacts.lockShapeIds.length > 0) {
                circle.fillColor = this.ORANGE
                circle.visible = true
            } else {
                circle.fillColor = this.GREEN
                circle.visible = true
            }
        }
    }
}
