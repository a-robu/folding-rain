import { describe, test, expect } from "vitest"
// import paper from "paper"
import { applySpecimen, expandFoldSpecimens } from "@/speciments/expand-fold-specimens"
import { verifyFold } from "@/lib/contacts"
import { Board } from "@/board"
import { FOLD_ACTION, FoldSpec } from "@/lib/fold-spec"

describe("verifyFold", () => {
    describe("expandFoldSpecimens", () => {
        // describe("expandFoldSpecimens", () => {
        //     test.each(expandFoldSpecimens.map(s => [s.description, s]))("case: %s", (_, specimen) => {
        // let board = new Board()
        // applySpecimen(board, specimen)
        // let fold = FoldSpec.fromEndPoints(specimen.foldStart, specimen.foldEnd, specimen.cover)
        // let verification = verifyFold(board, fold, FOLD_ACTION.Expand, 1)
        //         for (let [side, perType] of Object.entries(verification)) {
        //             for (let [type, result] of Object.entries(perType)) {
        //                 let stringPath = `${side}.${type}`
        //                 let expectedFailure = false
        //                 if (specimen.expectedFailedChecks) {
        //                     expectedFailure = specimen.expectedFailedChecks.includes(stringPath)
        //                 }
        //                 assert(
        //                     result === !failureExpected,
        //                     `Verification failed for ${stringPath}: expected ${!failureExpected}, got ${result}`
        //                 )
        //             }
        //         }
        //     })
        // })

        describe.each(expandFoldSpecimens.map(s => [s.description, s]))(
            "case: %s",
            (_, specimen) => {
                let board = new Board()
                applySpecimen(board, specimen)
                let fold = FoldSpec.fromEndPoints(
                    specimen.foldStart,
                    specimen.foldEnd,
                    specimen.cover
                )
                let verification = verifyFold(board, fold, FOLD_ACTION.Expand, 1)
                let cases = []
                for (let [side, perType] of Object.entries(verification)) {
                    for (let [type, result] of Object.entries(perType)) {
                        let stringPath = `${side}.${type}`
                        let expectedFailure = false
                        if (specimen.expectedFailedChecks) {
                            expectedFailure = specimen.expectedFailedChecks.includes(stringPath)
                        }
                        let expectedResult = !expectedFailure
                        cases.push([stringPath, expectedResult, result])
                    }
                }
                test.each(cases)("expected %s == %s", (_, expectedResult, result) => {
                    expect(result).toEqual(expectedResult)
                })
            }
        )
    })
})
