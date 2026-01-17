import { isDefined } from '@rnw-community/shared';

interface CategoryWithTitle {
    title: string;
}

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

const findCategoryByTitle = <T extends CategoryWithTitle>(response: string, categories: T[]): T | undefined => {
    const normalized = response.trim().toLowerCase();

    const exact = categories.find(cat => cat.title.toLowerCase() === normalized);
    if (isDefined(exact)) {
        return exact;
    }

    const partialMatch = categories.find(
        cat => normalized.includes(cat.title.toLowerCase()) || cat.title.toLowerCase().includes(normalized)
    );
    if (isDefined(partialMatch)) {
        return partialMatch;
    }

    const words = normalized.split(/\s+/u);
    const wordMatch = words
        .map(word => categories.find(cat => cat.title.toLowerCase().includes(word) || word.includes(cat.title.toLowerCase())))
        .find(isDefined);

    return wordMatch;
};

export const extractCategoryFromResponse = <T extends CategoryWithTitle>(
    response: string,
    limitedCategories: T[],
    allCategories: T[]
): T | null => {
    const indexFromResponse = extractCategoryIndex(response);
    // eslint-disable-next-line no-undefined
    const categoryByIndex = isDefined(indexFromResponse) ? limitedCategories[indexFromResponse - 1] : undefined;
    const categoryByTitle = findCategoryByTitle(response, allCategories);

    return categoryByIndex ?? categoryByTitle ?? null;
};
