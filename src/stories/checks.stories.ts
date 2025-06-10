import paper from "paper"
import { FOLD_ACTION, FoldSpec } from "@/lib/fold"
import { rigamarole } from "./rigamarole"
import { allTriangleIdxs, allVertices, makeTrianglePolygon } from "@/lib/tetrakis"
import { sleep } from "@/lib/time"

export default {
    title: "Checks"
}

export function latticeTrianglesAndPoints() {
    let bounds = new paper.Rectangle(0, 0, 5, 5)
    let { container, animatedBoard, annotationsLayer } = rigamarole({
        bounds,
        zoom: 70,
        drawGridLines: false
    })

    // Triangles
    let latticeVizTriangles: paper.Path[] = []
    for (let tx of allTriangleIdxs(bounds)) {
        let triangle = makeTrianglePolygon(tx)
        triangle.fillColor = new paper.Color(0, 1, 0, 0.5) // green
        triangle.visible = false // initially hidden
        annotationsLayer.addChild(triangle)
        latticeVizTriangles.push(triangle)
    }

    // Points
    let latticeVizPoints: { point: paper.Point; circle: paper.Path.Circle }[] = []
    for (let vertex of allVertices(bounds)) {
        let circle = new paper.Path.Circle(vertex, 0.1)
        circle.fillColor = new paper.Color(0, 1, 0, 0.5) // green
        circle.visible = false // initially hidden
        annotationsLayer.addChild(circle)
        latticeVizPoints.push({ point: vertex, circle })
    }

    function onShapeUpdate() {
        // Update triangles
        for (let triangle of latticeVizTriangles) {
            triangle.visible = !triangle.intersects(animatedBoard.shapes.get(1) as paper.Item)
        }
        // Update points
        for (let { point, circle } of latticeVizPoints) {
            circle.visible = !(
                circle.intersects(animatedBoard.shapes.get(1) as paper.Item) ||
                animatedBoard.shapes.get(1)?.contains(point)
            )
        }
    }

    animatedBoard.onShapeUpdate = onShapeUpdate
    onShapeUpdate()

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
