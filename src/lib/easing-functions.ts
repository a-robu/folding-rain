/**
 * Easing function based on cosine
 * @param t - The progress of the animation, from 0 to 1
 * @returns A value from 0 to 1, which moves as fast as the point on wheel
 * when viewed from above
 */
export function cosineEase(t: number) {
    return (-Math.cos(t * Math.PI) + 1) / 2
}

export function easeOutCirc(x: number): number {
    // https://easings.net/#easeOutCirc
    return Math.sqrt(1 - Math.pow(x - 1, 2))
}

export function easeOutBounce(x: number): number {
    // https://easings.net/#easeOutBounce
    const n1 = 7.5625
    const d1 = 2.75

    if (x < 1 / d1) {
        return n1 * x * x
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375
    }
}
