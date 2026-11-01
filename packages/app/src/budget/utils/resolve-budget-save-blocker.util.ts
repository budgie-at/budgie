import { budgetComputeAllocation } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

import { isNotEmptyString } from '@rnw-community/shared';

import { BudgetFormSchema } from '../constant/budget-form-schema.constant';
import { BUDGET_SAVE_BLOCKER_LABEL } from '../constant/budget-save-blocker-label.constant';

import type { BudgetFormValues } from '../constant/budget-form-schema.constant';
import type { MessageDescriptor } from '@lingui/core';

export const resolveBudgetSaveBlocker = (values: BudgetFormValues): MessageDescriptor | null => {
    const isFixed = values.limitSource === BudgetLimitSourceEnum.FIXED;

    if (!isNotEmptyString(values.name.trim())) {
        return BUDGET_SAVE_BLOCKER_LABEL.name;
    }

    if (isFixed && values.overallLimit <= 0) {
        return BUDGET_SAVE_BLOCKER_LABEL.limit;
    }

    if (values.categoryLimits.some(limit => limit.limitAmount <= 0)) {
        return BUDGET_SAVE_BLOCKER_LABEL.categoryLimit;
    }

    if (isFixed && budgetComputeAllocation(values).isOverAllocated) {
        return BUDGET_SAVE_BLOCKER_LABEL.overAllocated;
    }

    return Schema.is(BudgetFormSchema.from)(values) ? null : BUDGET_SAVE_BLOCKER_LABEL.invalid;
};
