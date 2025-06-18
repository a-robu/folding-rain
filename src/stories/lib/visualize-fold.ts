import paper from "paper"
import { FoldSpec, type FoldAction, FOLD_TEMPLATES, SHAPE_CHANGE } from "@/lib/fold-spec"

export function visualiseFoldSpec(foldSpec: FoldSpec, foldAction: FoldAction): paper.Group {
    // do them as transparent gray triangles,
    // bit with a + or - sign in the middle (for add or remove) for each triangle
    let createdBits = new paper.Group({ insert: false })
    let foldSpecTriangles = foldSpec.toTriangles()
    let foldTemplate = FOLD_TEMPLATES[foldAction]
    let symbol = {
        [SHAPE_CHANGE.Add]: "+",
        [SHAPE_CHANGE.Remove]: "-",
        [SHAPE_CHANGE.Keep]: "•"
    }
    let hingeCenter = foldSpec.hinges[0].add(foldSpec.hinges[1]).divide(2)
    let midpoints = {
        near: foldSpec.start.add(hingeCenter).divide(2),
        far: foldSpec.end.add(hingeCenter).divide(2)
    }
    for (let side of ["near", "far"] as const) {
        let triangle = foldSpecTriangles[side]
        let clone = triangle.clone()
        let shapeChange = foldTemplate[side]
        if (shapeChange == SHAPE_CHANGE.Keep) {
            clone.strokeColor = new paper.Color("#555a")
            clone.strokeWidth = 0.03
            clone.dashArray = [0.1, 0.04]
        } else if (shapeChange == SHAPE_CHANGE.Add) {
            clone.fillColor = new paper.Color("#0f06")
        } else if (shapeChange == SHAPE_CHANGE.Remove) {
            clone.fillColor = new paper.Color("#f006")
        }
        createdBits.addChild(clone)
        let text = new paper.PointText({
            content: symbol[shapeChange],
            point: midpoints[side].add(new paper.Point(0, 0.13)),
            fillColor: "#555a",
            fontSize: 0.4,
            justification: "center",
            insert: false
        })
        createdBits.addChild(text)
        let firstHingeDot = new paper.Path.Circle({
            center: foldSpec.hinges[0],
            radius: 0.05,
            insert: false
        })
        firstHingeDot.fillColor = new paper.Color("#555a")
        createdBits.addChild(firstHingeDot)
    }
    let endArrow = new paper.Path([
        foldSpec.end.add(foldSpec.hinges[0].subtract(foldSpec.end).normalize(0.2)),
        foldSpec.end,
        foldSpec.end.add(foldSpec.hinges[1].subtract(foldSpec.end).normalize(0.2))
    ])
    endArrow.strokeColor = new paper.Color("#555d")
    endArrow.strokeWidth = 0.04
    createdBits.addChild(endArrow)
    return createdBits
}
