import { CategoryEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

const MAX_SUGGESTIONS = 3;

export const parseCategorySuggestionResponse = (response: string, categories: Pick<CategoryEntityInterface, 'id'>[]): number[] => {
    const trimmed = response.trim();
    const categoryIds = trimmed
        .split(',')
        .map(part => parseInt(part.trim(), 10))
        .filter(id => !isNaN(id) && id !== 0)
        .map(id => (categories.some(category => category.id === id) ? id : null))
        .filter(isDefined)
        .slice(0, MAX_SUGGESTIONS);

    return categoryIds;
};
