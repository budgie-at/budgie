import { msg } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { BudgetFundFormSchema } from '../constant/budget-fund-form-schema.constant';
import { BUDGET_SAVE_BLOCKER_LABEL } from '../constant/budget-save-blocker-label.constant';

import type { BudgetFundFormValues } from '../constant/budget-fund-form-schema.constant';
import type { MessageDescriptor } from '@lingui/core';

export const resolveBudgetFundSaveBlocker = (values: BudgetFundFormValues): MessageDescriptor | null => {
    if (!isNotEmptyString(values.name.trim())) {
        return BUDGET_SAVE_BLOCKER_LABEL.name;
    }

    if (!isPositiveNumber(values.categoryId)) {
        return msg`Choose a category to continue`;
    }

    if (!isPositiveNumber(values.targetAmount)) {
        return msg`Set an amount to continue`;
    }

    return Schema.is(BudgetFundFormSchema)(values) ? null : BUDGET_SAVE_BLOCKER_LABEL.invalid;
};
