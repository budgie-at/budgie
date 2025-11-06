export const WORDS_PER_MINUTE = 200;

export const calculateReadingTime = (text: string): number => {
    const wordCount = text.split(/\s+/iu).length;

    return Math.ceil(wordCount / WORDS_PER_MINUTE);
};
