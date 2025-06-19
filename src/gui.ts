import paper from "paper"

export class GUI {
    private view: paper.View
    private lastPinchDistance: number | null = null
    private lastPinchCenter: paper.Point | null = null
    onResize: () => void = () => {}

    constructor(view: paper.View) {
        this.view = view
    }

    onMouseDrag(event: paper.ToolEvent) {
        let pan_offset = event.point.subtract(event.downPoint)
        this.view.center = this.view.center.subtract(pan_offset)

        this.onResize()
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
        this.onResize()
        event.preventDefault()
    }

    attachPinchZoom(canvas: HTMLCanvasElement) {
        canvas.addEventListener(
            "touchstart",
            e => {
                if (e.touches.length === 2) {
                    this.lastPinchDistance = this.getTouchDistance(e)
                    this.lastPinchCenter = this.getTouchCenter(e, canvas)
                }
            },
            { passive: false }
        )
        canvas.addEventListener(
            "touchmove",
            e => {
                if (
                    e.touches.length === 2 &&
                    this.lastPinchDistance !== null &&
                    this.lastPinchCenter !== null
                ) {
                    const newDistance = this.getTouchDistance(e)
                    const scale = newDistance / this.lastPinchDistance
                    const oldZoom = this.view.zoom
                    let newZoom = oldZoom * scale
                    // Clamp zoom to reasonable range
                    newZoom = Math.max(0.01, Math.min(100, newZoom))
                    let beta = oldZoom / newZoom
                    let mpos = this.lastPinchCenter
                    let ctr = this.view.center
                    let pc = mpos.subtract(ctr)
                    let offset = mpos.subtract(pc.multiply(beta)).subtract(ctr)
                    this.view.zoom = newZoom
                    this.view.center = this.view.center.add(offset)
                    this.lastPinchDistance = newDistance
                    this.onResize()
                    e.preventDefault()
                }
            },
            { passive: false }
        )
        canvas.addEventListener("touchend", e => {
            if (e.touches.length < 2) {
                this.lastPinchDistance = null
                this.lastPinchCenter = null

                this.onResize()
            }
        })
    }

    private getTouchDistance(e: TouchEvent): number {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    private getTouchCenter(e: TouchEvent, canvas: HTMLCanvasElement): paper.Point {
        const rect = canvas.getBoundingClientRect()
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        return this.view.viewToProject(new paper.Point(x, y))
    }
}
