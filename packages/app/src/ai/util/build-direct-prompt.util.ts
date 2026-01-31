import { CategoryEntityInterface } from '@budgie/contracts';

import { COMMON_CURRENCIES } from '../constant/llm-categorization.constant';

const getCategoryLabel = (category: CategoryEntityInterface): string => category.titleTags ?? category.title;

export const buildDirectPrompt = (categories: CategoryEntityInterface[]): string => {
    const userCategories = categories.filter(category => !category.isSystemCategory && !category.isDefault);
    const categoryList = userCategories.map(category => `${category.id}=${getCategoryLabel(category)}`).join(', ');
    const currencies = COMMON_CURRENCIES.join(', ');

    /* eslint-disable lingui/no-unlocalized-strings */
    return `Extract expenses from text. Return JSON array.

CATEGORIES: ${categoryList}

CURRENCIES: ${currencies}

FORMAT: [{"categoryId":N,"amount":N,"currency":"XXX"}]

RULES:
- ONE amount = ONE entry (never duplicate the same amount)
- Pick the BEST matching category for each expense
- Multiple entries ONLY when multiple amounts are mentioned
- categoryId = NUMBER from list
- currency = 3-letter code or null

Example: "coffee 5 usd, taxi 10" -> [{"categoryId":1,"amount":5,"currency":"USD"},{"categoryId":2,"amount":10,"currency":null}]
Example: "pizza at restaurant 10" -> [{"categoryId":3,"amount":10,"currency":null}] (ONE entry, not two)`;
    /* eslint-enable lingui/no-unlocalized-strings */
};
