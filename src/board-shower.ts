import type { FoldCoordinates } from "./lib/fold"

class BoardShower {
    onFold(
        foldPlan: FoldCoordinates, // TODO rename to FoldPlan
        createLock: () => { release(): void }
    ) {
        const lock = createLock()
        // TODO implement folding logic
    }
}
