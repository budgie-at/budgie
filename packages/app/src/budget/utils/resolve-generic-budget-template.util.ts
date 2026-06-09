import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GENERIC_BUDGET_TEMPLATE_CATEGORIES } from '../constant/generic-budget-template.constant';
import { GENERIC_PRESET_TOTAL_BY_CURRENCY, GENERIC_PRESET_TOTAL_DEFAULT } from '../constant/generic-preset-by-currency.constant';

import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

type CategoryRow = Pick<CategoryEntityInterface, 'id' | 'title' | 'titleEn' | 'isDefault'>;

const ROUNDING_STEP = 100;

const roundToStep = (value: number): number => Math.round(value / ROUNDING_STEP) * ROUNDING_STEP;

export const resolveGenericBudgetTemplate = (categories: CategoryRow[], currencyCode: string): BudgetTemplateDraftInterface => {
    const total = GENERIC_PRESET_TOTAL_BY_CURRENCY[currencyCode] ?? GENERIC_PRESET_TOTAL_DEFAULT;

    const categoryLimits = GENERIC_BUDGET_TEMPLATE_CATEGORIES.flatMap(template => {
        const match = categories.find(
            category => category.isDefault && (category.title === template.defaultTitle || category.titleEn === template.defaultTitle)
        );

        if (!isDefined(match)) {
            return [];
        }

        const limitAmount = roundToStep(total * template.weight);

        if (limitAmount <= 0) {
            return [];
        }

        return [{ categoryId: match.id, limitAmount }];
    });

    const overallLimit = isNotEmptyArray(categoryLimits) ? categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0) : total;

    return { overallLimit, categoryLimits };
};
