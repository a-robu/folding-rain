// import type { Board } from "@/board"
// import { allVertices } from "@/lib/grid"
// import paper from "paper"

// export class ContactViz {
//     private gridVizTriangles: Map<string, paper.Path> = new Map()
//     private triangleLabels: Map<string, paper.PointText> = new Map()
//     private gridVizPoints: { point: paper.Point; circle: paper.Path.Circle }[] = []
//     private GREEN = new paper.Color(0, 1, 0, 0.5)
//     private ORANGE = new paper.Color(1, 0.5, 0, 0.5)
//     private board: any
//     // private showAvailability: boolean
//     // private showContactId: boolean

//     constructor(
//         bounds: paper.Rectangle,
//         annotationsLayer: paper.Layer,
//         board: Board,
//         showAvailability = false,
//         showContactId = false
//     ) {
//         this.board = board
//         this.showAvailability = showAvailability
//         this.showContactId = showContactId
//         // Triangles
//         for (let tx of allTriangleIdxs(bounds)) {
//             let triangle = makeTrianglePolygon(tx)
//             triangle.visible = false
//             annotationsLayer.addChild(triangle)
//             this.gridVizTriangles.set(triangleIdxToKey(tx), triangle)
//         }

//         for (let tx of allTriangleIdxs(bounds)) {
//             let label = new paper.PointText({
//                 content: "1",
//                 point: makeTrianglePolygon(tx).bounds.center.add(new paper.Point(0, 0.04)),
//                 fontSize: 0.16,
//                 justification: "center"
//             })
//             annotationsLayer.addChild(label)
//             this.triangleLabels.set(triangleIdxToKey(tx), label)
//         }

//         // Points
//         for (let vertex of allVertices(bounds)) {
//             let circle = new paper.Path.Circle(vertex, 0.1)
//             circle.visible = false
//             annotationsLayer.addChild(circle)
//             this.gridVizPoints.push({ point: vertex, circle })
//         }

//         this.board.addShapeUpdateListener(this.onShapeUpdate.bind(this))
//     }

//     onShapeUpdate() {
//         // for (let [key, triangle] of this.gridVizTriangles) {
//         // let contacts = this.board.findPolygonContacts(triangle)
//         //     if (this.showAvailability) {
//         //         if (contacts.shapeIds.length > 0) {
//         //             triangle.visible = false
//         //         } else if (contacts.lockShapeIds.length > 0) {
//         //             triangle.fillColor = this.ORANGE
//         //             triangle.visible = true
//         //         } else {
//         //             triangle.fillColor = this.GREEN
//         //             triangle.visible = true
//         //         }
//         //     } else {
//         //         triangle.visible = false
//         //     }
//         //     let label = this.triangleLabels.get(key)
//         //     if (this.showContactId) {
//         //         if (contacts.lockShapeIds.length == 0 && contacts.shapeIds.length == 0) {
//         //             label!.content = ""
//         //         } else if (contacts.shapeIds.length > 0 && contacts.lockShapeIds.length == 0) {
//         //             label!.content = `${contacts.shapeIds}`
//         //         } else {
//         //             label!.content = `${contacts.shapeIds}/${contacts.lockShapeIds}`
//         //         }
//         //         label!.visible = true
//         //     } else {
//         //         label!.visible = false
//         //     }
//         // }
//         for (let { point, circle } of this.gridVizPoints) {
//             let contacts = this.board.findPointContacts(point)
//             if (contacts.shapeIds.length > 0) {
//                 circle.visible = false
//             } else if (contacts.lockShapeIds.length > 0) {
//                 circle.fillColor = this.ORANGE
//                 circle.visible = true
//             } else {
//                 circle.fillColor = this.GREEN
//                 circle.visible = true
//             }
//         }
//     }
// }
