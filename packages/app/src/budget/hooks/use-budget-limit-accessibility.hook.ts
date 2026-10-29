import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { BUDGET_PACE_STATUS_LABEL } from '../constant/budget-pace-status-label.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const PERCENT_MULTIPLIER = 100;

export const useBudgetLimitAccessibility = (title: string, scope: BudgetProjectionScopeInterface, currencySymbol: string) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const spentAmount = formatProtectedAmount(convertFromMicroUnits(scope.spent), currencySymbol);
    const limitAmount = formatProtectedAmount(convertFromMicroUnits(scope.limit), currencySymbol);
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[scope.status]);
    const percent = isPositiveNumber(scope.limit) ? Math.round((scope.spent / scope.limit) * PERCENT_MULTIPLIER) : 0;

    return {
        accessibilityLabel: t`${title}, spent ${spentAmount} of ${limitAmount}, ${statusLabel}`,
        accessibilityValue: { text: t`${percent}% used` }
    };
};
