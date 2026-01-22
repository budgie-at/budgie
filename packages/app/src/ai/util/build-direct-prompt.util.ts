import { CategoryEntityInterface } from '@budgie/contracts';

import { COMMON_CURRENCIES } from '../constant/llm-categorization.constant';

import { filterUserCategories } from './filter-user-categories.util';

export const buildDirectPrompt = (categories: CategoryEntityInterface[]): string => {
    const userCategories = filterUserCategories(categories);
    const categoryList = userCategories.map(category => `${category.id}=${category.title}`).join(', ');
    const currencies = COMMON_CURRENCIES.join(', ');

    /* eslint-disable lingui/no-unlocalized-strings */
    return `Extract ALL expenses from text. Return JSON array.

CATEGORIES: ${categoryList}

CURRENCIES: ${currencies}

FORMAT: [{"categoryId":N,"amount":N,"currency":"XXX"}]

RULES:
- Return array even for single item
- categoryId = NUMBER from list
- currency = 3-letter code or null
- User may speak in any language

Example: "coffee 5 usd, taxi 10" -> [{"categoryId":1,"amount":5,"currency":"USD"},{"categoryId":2,"amount":10,"currency":null}]`;
    /* eslint-enable lingui/no-unlocalized-strings */
};
