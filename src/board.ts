import paper from "paper"

export class Board {
    readonly gridIncrement = 25
    readonly gridSize: number

    constructor(gridSize: number) {
        this.gridSize = gridSize
    }

    gridToPaperCoordinates(gridPoint: paper.Point): paper.Point {
        return new paper.Point(gridPoint.x * this.gridIncrement, gridPoint.y * this.gridIncrement)
    }

    paperToGridCoordinates(paperPoint: paper.Point): paper.Point {
        return new paper.Point(
            Math.floor((paperPoint.x + 0.5 * this.gridIncrement) / this.gridIncrement),
            Math.floor((paperPoint.y + 0.5 * this.gridIncrement) / this.gridIncrement)
        )
    }

    isInBounds(gridPoint: paper.Point): boolean {
        return gridPoint.x >= 0 && gridPoint.x < this.gridSize && gridPoint.y >= 0 && gridPoint.y < this.gridSize
    }
}

