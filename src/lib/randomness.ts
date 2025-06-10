import type PRNG from "random-seedable/@types/PRNG"

/**
 * Pick one element at random from an array, using a probability distribution.
 * @param array The array of elements to choose from.
 * @param probabilities An array of probabilities corresponding to each element. Must sum to 1.
 */

export function randomChoiceWeighted<T>(generator: PRNG, array: T[], probabilities: number[]): T {
    if (array.length !== probabilities.length) {
        throw new Error("Array and probabilities must have the same length")
    }
    let r = generator.float()
    let cumulative = 0
    for (let i = 0; i < array.length; i++) {
        cumulative += probabilities[i]
        if (r < cumulative) {
            return array[i]
        }
    }
    // Fallback in case of floating point error
    return array[array.length - 1]
}

export function normalise(probabilities: number[]): number[] {
    let sum = probabilities.reduce((a, b) => a + b, 0)
    if (sum === 0) {
        throw new Error("Probabilities must not sum to zero")
    }
    return probabilities.map(p => p / sum)
}
