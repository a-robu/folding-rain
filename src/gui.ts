import paper from "paper"

export class GUI {
    private view: paper.View

    constructor(view: paper.View) {
        this.view = view
    }

    onMouseDrag(event: paper.ToolEvent) {
        let pan_offset = event.point.subtract(event.downPoint)
        this.view.center = this.view.center.subtract(pan_offset)
    }

    onWheel(event: WheelEvent) {
        let newZoom = this.view.zoom
        let oldZoom = this.view.zoom
        if (event.deltaY > 0) {
            newZoom = this.view.zoom * 0.8
        } else {
            newZoom = this.view.zoom * 1.2
        }
        let beta = oldZoom / newZoom
        let mousePosition = new paper.Point(event.offsetX, event.offsetY)
        let viewPosition = this.view.viewToProject(mousePosition)
        let mpos = viewPosition
        let ctr = this.view.center
        let pc = mpos.subtract(ctr)
        let offset = mpos.subtract(pc.multiply(beta)).subtract(ctr)
        this.view.zoom = newZoom
        this.view.center = this.view.center.add(offset)
        event.preventDefault()
    }
}
