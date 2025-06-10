import "vitest"

interface CustomMatchers<R = unknown> {
    toBePaperPoint(expected: paper.Point): R
}

declare module "vitest" {
    interface Matchers<T = any> extends CustomMatchers<T> {}
}
