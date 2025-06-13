export type ShowVertexLabels = "off" | "vertexId" | "vertexAngle"

export const commonArgTypes = {
    drawGridLines: { control: "boolean", defaultValue: true },
    latticeAvailability: { control: "boolean", defaultValue: false },
    latticeContactid: { control: "boolean", defaultValue: false },
    showShapeId: { control: "boolean", defaultValue: false },
    showVertexLabels: {
        control: { type: "radio" },
        options: ["off", "vertexId", "vertexAngle"],
        defaultValue: "off"
    }
}

export const commonArgs = {
    drawGridLines: true,
    latticeAvailability: false,
    latticeContactid: false,
    showShapeId: false,
    showVertexLabels: "off" as ShowVertexLabels
}

// Helper to apply common argTypes and args to a story
export function withCommonArgs<T extends (...args: any[]) => any>(
    storyFn: T,
    argsOverride: Partial<typeof commonArgs> = {}
) {
    function wrapped(args: any) {
        return storyFn(args)
    }
    wrapped.argTypes = commonArgTypes
    wrapped.args = { ...commonArgs, ...argsOverride }
    return wrapped as unknown as T
}

export type CommonStoryArgs = typeof commonArgs
