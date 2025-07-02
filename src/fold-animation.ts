import { easeOutCirc, cosineEase } from "@/lib/easing-functions"

export class FoldAnimation {
    flap: paper.Path
    tip: paper.Segment
    apexTrajectory: paper.Path
    initialColor: paper.Color
    subsequentColor: paper.Color
    t: number
    duration: number

    constructor(
        flap: paper.Path,
        tip: paper.Segment,
        apexTrajectory: paper.Path,
        initialColor: paper.Color,
        subsequentColor: paper.Color,
        duration: number
    ) {
        this.flap = flap
        this.tip = tip
        this.apexTrajectory = apexTrajectory
        this.initialColor = initialColor
        this.subsequentColor = subsequentColor
        this.t = 0
        this.duration = duration
    }

    get progress() {
        return this.t / this.duration
    }

    private brighten(color: paper.Color, progress: number) {
        // Function which maps 0 -> 0, 0.5 -> 1, 1 -> 0
        let triangleFunction = (x: number) => {
            if (x < 0) return 0
            if (x > 1) return 0
            return 1 - Math.abs(x - 0.5) * 2
        }
        let newColor = color.clone()
        let changeAmount = 0.4
        newColor.lightness =
            color.lightness +
            (color.lightness < changeAmount ? 1 : -1) * changeAmount * triangleFunction(progress)
        return newColor
    }

    onFrame() {
        // The cosine ease creates the effect of a triangle holding its shape, but
        // moving around a hinge and the out-bounce gives the effect of a flap
        // falling down and bouncing a bit.
        let animatedProgress = easeOutCirc(cosineEase(this.progress))

        this.tip.point = this.apexTrajectory.getPointAt(
            this.apexTrajectory.length * animatedProgress
        )
        if (animatedProgress < 0.5) {
            this.flap.fillColor = this.brighten(this.initialColor, animatedProgress)
        } else {
            this.flap.fillColor = this.brighten(this.subsequentColor, animatedProgress)
        }
    }

    onDone() {
        this.flap.remove()
    }
}
