import { CategoryEntityInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { filterUserCategories } from './filter-user-categories.util';

const MAX_TAGS = 3;

const getFirstTags = (titleTags: string | null): string[] => {
    if (!isNotEmptyString(titleTags)) {
        return [];
    }

    return titleTags
        .split(',')
        .map(tag => tag.trim())
        .filter(isNotEmptyString)
        .slice(0, MAX_TAGS);
};

const getCategoryLabel = (category: CategoryEntityInterface): string => {
    const title = category.titleEn ?? category.title;
    const tags = getFirstTags(category.titleTags);

    if (tags.length === 0) {
        return title;
    }

    return `${title} (${tags.join(', ')})`;
};

export const buildCategorySuggestionPrompt = (categories: CategoryEntityInterface[]): string => {
    const userCategories = filterUserCategories(categories);
    const categoryList = userCategories.map(category => `${category.id}=${getCategoryLabel(category)}`).join(', ');

    /* eslint-disable lingui/no-unlocalized-strings */
    return `Match the transaction to a category. Return ONLY the category ID number.

CATEGORIES: ${categoryList}

EXAMPLES:
Transaction: McDonalds | Type: Fast Food Restaurant -> 292
Transaction: Uber | Type: Taxicabs -> 364

RULES:
- Return ONLY a number
- Match transaction to the most relevant category
- If no match, return 0`;
    /* eslint-enable lingui/no-unlocalized-strings */
};
