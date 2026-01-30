import { CategoryEntityInterface } from '@budgie/contracts';

import { filterUserCategories } from './filter-user-categories.util';

export const buildCategorySuggestionPrompt = (categories: CategoryEntityInterface[]): string => {
    const userCategories = filterUserCategories(categories);
    const categoryList = userCategories.map(category => `${category.id}=${category.title}`).join(', ');

    /* eslint-disable lingui/no-unlocalized-strings */
    return `Pick the best expense category. Return ONLY the category ID number.

CATEGORIES: ${categoryList}

RULES:
- Return ONLY a number (the category ID)
- Pick the single BEST matching category
- If unsure, return 0`;
    /* eslint-enable lingui/no-unlocalized-strings */
};
