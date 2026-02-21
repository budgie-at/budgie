export const stripThinkingTags = (text: string): string => {
    const openTag = '<think>';
    const closeTag = '</think>';
    let result = text;
    let startIndex = result.indexOf(openTag);

    while (startIndex !== -1) {
        const endIndex = result.indexOf(closeTag, startIndex + openTag.length);

        if (endIndex === -1) {
            result = result.slice(0, startIndex);
            break;
        }

        result = result.slice(0, startIndex) + result.slice(endIndex + closeTag.length);
        startIndex = result.indexOf(openTag);
    }

    return result.trim();
};
