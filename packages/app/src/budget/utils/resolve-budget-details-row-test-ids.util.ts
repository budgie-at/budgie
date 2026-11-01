import { BudgetAlertScopeEnum } from '@budgie/budget';

import { isDefined } from '@rnw-community/shared';

import { BudgetSelector } from '../budget.selector';

import type { BudgetDetailsRowTestIDsInterface } from '../interface/budget-details-row-test-ids.interface';
import type { BudgetHighlightTargetInterface } from '../interface/budget-highlight-target.interface';

export const resolveBudgetDetailsRowTestIDs = (target: BudgetHighlightTargetInterface): BudgetDetailsRowTestIDsInterface =>
    target.scope === BudgetAlertScopeEnum.CATEGORY && isDefined(target.categoryId)
        ? { row: BudgetSelector.DetailsCategoryRow(target.categoryId), spent: BudgetSelector.DetailsCategorySpentLabel(target.categoryId) }
        : { row: BudgetSelector.DetailsOtherCategoryRow, spent: BudgetSelector.DetailsOtherCategorySpentLabel };
