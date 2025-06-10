import { expect } from "vitest"
import paper from "paper"

expect.extend({
    toBePaperPoint(received: paper.Point, expected: paper.Point) {
        const pass =
            received instanceof paper.Point &&
            expected instanceof paper.Point &&
            Math.abs(received.x - expected.x) < 1e-9 &&
            Math.abs(received.y - expected.y) < 1e-9
        if (pass) {
            return {
                message: () =>
                    `expected ${received.toString()} not to be paper.Point equal to ${expected.toString()}`,
                pass: true
            }
        } else {
            return {
                message: () =>
                    `expected ${received.toString()} to be paper.Point equal to ${expected.toString()}`,
                pass: false
            }
        }
    }
})

if (!paper.project) {
    paper.setup(new paper.Size(100, 100))
}
