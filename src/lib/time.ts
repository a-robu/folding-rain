export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function exponentialDelay(ratePerSecond: number): number {
    // λ = rate (events per second)
    // Exponential distribution: -ln(U) / λ
    const U = Math.random()
    return (-Math.log(1 - U) / ratePerSecond) * 1000 // Convert to milliseconds
}
