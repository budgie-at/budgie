/* eslint-disable require-unicode-regexp */

// Blog utility functions and constants

// Average reading speed in words per minute
export const WORDS_PER_MINUTE = 200;

/**
 * Calculate estimated reading time for content
 * @param text - The text content to analyze
 * @returns Reading time in minutes (rounded up)
 */
export const calculateReadingTime = (text: string): number => {
    const wordCount = text.split(/\s+/).length;

    return Math.ceil(wordCount / WORDS_PER_MINUTE);
};
