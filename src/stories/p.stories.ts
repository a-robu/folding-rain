export default {
    title: "Minimal/Paragraph"
}

export const Paragraph = () => {
    const p = document.createElement("p")
    p.textContent = "Hello, Storybook!"
    return p
}
