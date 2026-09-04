export const fitText = (text: string, maxChars: number): string => {
    if (text.length <= maxChars) {
        return text;
    }

    const cut = text.slice(0, maxChars - 1);
    const boundary = cut.lastIndexOf(' ');
    const trimmed = (boundary > cut.length * 0.6 ? cut.slice(0, boundary) : cut).trimEnd();

    return `${trimmed.replace(/[|,;:\s]+$/u, '')}…`;
};
