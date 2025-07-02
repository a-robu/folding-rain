import paper from "paper"
import { Board } from "./board"
import { ProceduralAnimation } from "./spontaneous"

export { Board, ProceduralAnimation }

export function computeBounds() {
    // console.log(paper.view.bounds)
    const bounds = paper.view.bounds
    // const zoom = paper.view.zoom
    return new paper.Rectangle(
        Math.floor(bounds.x),
        Math.floor(bounds.y),
        Math.ceil(bounds.width),
        Math.ceil(bounds.height)
    )
}
