import { defineUnfoldFromBg, snapToDiagonalOrAALine } from "./interact"
import { Game } from "./game"
import type { Board } from "./board"
import paper from "paper"

type ToolChoices = "pan" | "unfold"



// let dragLine = new paper.Path()
// dragLine.visible = false

// let dragFirstTriangle = new paper.Path()
// dragFirstTriangle.visible = false
// dragFirstTriangle.fillColor = new paper.Color(0.5, 0.5, 0.5)
// dragFirstTriangle.opacity = 0.5
// dragFirstTriangle.strokeWidth = 0

// let dragSecondTriangle = new paper.Path()
// dragSecondTriangle.visible = false
// dragSecondTriangle.fillColor = new paper.Color(0.5, 0.5, 0.5)
// dragSecondTriangle.opacity = 0.5
// dragSecondTriangle.strokeWidth = 0


export class GUI {
    private gridSelectionDot: paper.Path.Circle
    private dragSquare: paper.Path
    private lastGridDrag: null | [paper.Point, paper.Point] = null
    private currentTool: ToolChoices = "unfold" // initialised to keep the compiler happy
    private game: Game
    private board: Board
    private view: paper.View
    panButton: HTMLElement
    foldButton: HTMLElement
    // private unfoldPlan: null | {
    //     start: paper.Point,
    //     hinges: paper.Point[],
    //     end: paper.Point
    // } = null

    // static create(
    //     game: Game,
    //     uiLayer: paper.Layer,
    //     setViewCenter: (point: paper.Point) => void
    // ): GUI {
    //     let gridSelectionDot = new paper.Path.Circle(new paper.Point(0, 0), 4)
    //     gridSelectionDot.strokeColor = new paper.Color(0.5, 0.5, 0.5)
    //     gridSelectionDot.visible = false
    //     uiLayer.addChild(gridSelectionDot)
    //     return new GUI(game, gridSelectionDot, setViewCenter)
    // }

    /**
     * Creates the GUI class, the UI elements and hooks up some of the event listeners!
     * @param game 
     * @param uiLayer 
     * @param setViewCenter 
     */
    constructor(
        board: Board,
        game: Game,
        uiLayer: paper.Layer,
        view: paper.View,
        panButton: HTMLElement,
        foldButton: HTMLElement
    ) {
        // Commands from the GUI will be sent to the game class, so make a note of it.
        this.game = game
        // We need to know how big the board is when handling cursor movement
        this.board = board
        // We will interact with the view when panning and zooming
        this.view = view

        // Initialise the selection dot GUI element
        this.gridSelectionDot = new paper.Path.Circle(new paper.Point(0, 0), 4)
        this.gridSelectionDot.strokeColor = new paper.Color(0.5, 0.5, 0.5)
        this.gridSelectionDot.visible = false
        uiLayer.addChild(this.gridSelectionDot)
        // Initialise the drag square GUI element
        this.dragSquare = new paper.Path()
        this.dragSquare.fillColor = new paper.Color(0.5, 0.5, 0.5)
        this.dragSquare.opacity = 0.5
        this.dragSquare.strokeWidth = 0
        this.dragSquare.visible = false
        uiLayer.addChild(this.dragSquare)

        this.panButton = panButton;
        this.foldButton = foldButton;
        this.setTool("unfold")
    }

    private setTool(tool: ToolChoices) {
        this.currentTool = tool
        if (tool == "pan") {
            this.panButton.classList.add('selected');
            this.foldButton.classList.remove('selected');
        }
        else if (tool == "unfold") {
            this.foldButton.classList.add('selected');
            this.panButton.classList.remove('selected');
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key == "1") {
            this.setTool("pan")
        } else if (event.key == "2") {
            this.setTool("unfold")
        }
    }

    centerView() {
        let bottomRightCorner = new paper.Point(
            this.board.width - 1, this.board.height - 1)
        this.view.center = this.board.gridToPaperCoordinates(bottomRightCorner).multiply(0.5)
    }

    onMouseDrag(event: paper.ToolEvent) {
        if (this.currentTool == "pan") {
            let pan_offset = event.point.subtract(event.downPoint);
            this.view.center = this.view.center.subtract(pan_offset);
        }
        else if (this.currentTool == "unfold") {
            let gridStart = this.board.paperToGridCoordinates(event.downPoint)
            if (!this.board.isInBounds(gridStart) || !this.board.lattice.vertexIsClear(gridStart)) {
                this.dragSquare.visible = false
                return
            }

            let gridRequestedEnd = this.board.paperToGridCoordinates(event.point)
            let gridEnd = snapToDiagonalOrAALine(gridStart, gridRequestedEnd)
    
            if (gridStart.equals(gridEnd)) {
                this.dragSquare.visible = false
                this.lastGridDrag = null
                return
            }

            this.lastGridDrag = [gridStart, gridEnd]

            let triangulisation = defineUnfoldFromBg(gridStart, gridEnd)
            this.dragSquare.visible = true
            this.dragSquare.removeSegments()
            this.dragSquare.add(this.board.gridToPaperCoordinates(triangulisation.start))
            this.dragSquare.add(this.board.gridToPaperCoordinates(triangulisation.hinges[0]))
            this.dragSquare.add(this.board.gridToPaperCoordinates(triangulisation.end))
            this.dragSquare.add(this.board.gridToPaperCoordinates(triangulisation.hinges[1]))
            this.dragSquare.closed = true
        }
    }

    onWheel(event: WheelEvent) {
        // LOL code copied from https://codepen.io/hichem147/pen/dExxNK
        let newZoom = this.view.zoom; 
        let oldZoom = this.view.zoom;
        if (event.deltaY > 0) {			
            newZoom = this.view.zoom * 0.8;
        } else {
            newZoom = this.view.zoom * 1.2;
        }
        let beta = oldZoom / newZoom;
        let mousePosition = new paper.Point(event.offsetX, event.offsetY);
        let viewPosition = this.view.viewToProject(mousePosition);
        let mpos = viewPosition;
        let ctr = this.view.center;
        let pc = mpos.subtract(ctr);
        let offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);	
        this.view.zoom = newZoom;
        this.view.center = this.view.center.add(offset);

        event.preventDefault();
    }

    onMouseUp(_: WheelEvent) {
        if (this.currentTool == "unfold") {
            if (this.lastGridDrag == null) {
                return
            }
            let [gridStart, gridEnd] = this.lastGridDrag
            let unfoldPlan = defineUnfoldFromBg(gridStart, gridEnd)
            this.dragSquare.visible = false
            this.game.unfold(unfoldPlan)

            this.lastGridDrag = null
        }
    }

    onMouseMove(event: paper.ToolEvent) {
        // add a purple dot at the point matching the grid coordinate
        let gridPoint = this.board.paperToGridCoordinates(event.point)
        let snappedPoint = this.board.gridToPaperCoordinates(gridPoint)
        this.gridSelectionDot.visible = false
        if (!this.board.isInBounds(gridPoint)) {
            return
        }
        if (!this.board.lattice.vertexIsClear(gridPoint)) {
            return
        }
        let wedges = this.board.all90DegWedges(gridPoint)
        if (wedges.length == 0) {
            return
        }
        let anyExpansions = false
        for (let wedge of wedges) {
            let expansions = this.board.allValidWedgeExpansions(gridPoint, wedge)
            if (expansions.length > 0) {
                anyExpansions = true
            }
        }
        if (!anyExpansions) {
            return
        }
        this.gridSelectionDot.position = snappedPoint
        this.gridSelectionDot.visible = true

//         let wedges = this.board.all90DegWedges(randomNode)
    //         if (wedges.length == 0) {
    //             continue
    //         }
    //         let randomWedge = randomChoice(wedges)
    //         let unfoldPlans = this.board.allValidWedgeExpansions(randomNode, randomWedge)
    //         if (unfoldPlans.length == 0) {
    //             continue
    //         }
    //         rainDropPlan = randomChoice(unfoldPlans)
    //     }
    //     this.unfold(rainDropPlan);
    // }

           
    }
    
}
