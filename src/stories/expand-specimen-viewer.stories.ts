import paper from "paper"
import { rigamarole } from "./lib/rigamarole"
import { withCommonArgs } from "./lib/common-args"
import type { CommonStoryArgs } from "./lib/common-args"
import { applySpecimen, expandFoldSpecimens } from "@/speciments/expand-fold-specimens"
import { verifyFold } from "@/lib/contacts"
import { FOLD_ACTION } from "@/lib/fold-spec"

export default {
    title: "Contacts"
}

export const expandSpecimenViewer = withCommonArgs(function expandSpecimenViewer(
    args: CommonStoryArgs & { foldSpecIndex?: string }
) {
    let specimenIndex = Number.parseInt(args.foldSpecIndex || "0")
    let specimen = expandFoldSpecimens[specimenIndex]
    let { container, board, resize, annotationsLayer } = rigamarole({
        zoom: 80,
        ...args
    })
    let { bounds, annotations, foldSpec } = applySpecimen(board, specimen)
    resize(bounds.expand(2))
    annotationsLayer.addChild(annotations)
    console.log(
        "Verification:",
        JSON.stringify(verifyFold(board, foldSpec, FOLD_ACTION.Expand, 1), null, 2)
    )
    board.shapes.get(1)!.fillColor = new paper.Color("#d8bff8")
    const shape2 = board.shapes.get(2)
    if (shape2) {
        shape2.fillColor = new paper.Color("#99ccff")
    }
    return container
}) as any

// Add a dropdown control for foldSpecIndex, only for this story
;(expandSpecimenViewer as any).argTypes = {
    ...(expandSpecimenViewer as any).argTypes,
    foldSpecIndex: {
        control: {
            type: "select",
            labels: expandFoldSpecimens.reduce(
                (acc, f, i) => {
                    acc[i] = f.description
                    return acc
                },
                {} as Record<number, string>
            )
        },
        options: expandFoldSpecimens.map((_, i) => i)
    }
}
