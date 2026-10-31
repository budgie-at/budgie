export const toExcerpt = (text: string, maxLength: number): string => {
    const characters = Array.from(text);

    return characters.length > maxLength ? `${characters.slice(0, maxLength).join('').trimEnd()}…` : text;
};
