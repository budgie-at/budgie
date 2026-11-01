import { budgetComputeAllocation } from '@budgie/budget';
import { msg } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { BudgetEventFormSchema } from '../constant/budget-event-form-schema.constant';
import { BUDGET_SAVE_BLOCKER_LABEL } from '../constant/budget-save-blocker-label.constant';

import type { BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';
import type { MessageDescriptor } from '@lingui/core';

export const resolveBudgetEventSaveBlocker = (values: BudgetEventFormValues): MessageDescriptor | null => {
    if (!isNotEmptyString(values.name.trim())) {
        return BUDGET_SAVE_BLOCKER_LABEL.name;
    }

    if (!isPositiveNumber(values.tagId)) {
        return msg`Choose a tag to continue`;
    }

    if (!isPositiveNumber(values.overallLimit)) {
        return BUDGET_SAVE_BLOCKER_LABEL.limit;
    }

    if (values.categoryLimits.some(limit => limit.limitAmount <= 0)) {
        return BUDGET_SAVE_BLOCKER_LABEL.categoryLimit;
    }

    if (budgetComputeAllocation({ ...values, otherLimit: 0 }).isOverAllocated) {
        return BUDGET_SAVE_BLOCKER_LABEL.overAllocated;
    }

    return Schema.is(BudgetEventFormSchema)(values) ? null : BUDGET_SAVE_BLOCKER_LABEL.invalid;
};
