import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedWholeAmountLabel } from '../../@generic/hook/use-protected-whole-amount-label.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

export const useBudgetForecastLabels = (scope: Pick<BudgetProjectionScopeInterface, 'limit' | 'projectedEnd'>, currencySymbol: string) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { limit, projectedEnd } = scope;
    const isOver = isDefined(projectedEnd) && projectedEnd > limit;
    const gapAmount = formatWholeAmount(convertFromMicroUnits(Math.abs(limit - (projectedEnd ?? limit))), currencySymbol);
    const projectedAmount = formatWholeAmount(convertFromMicroUnits(projectedEnd ?? limit), currencySymbol);
    const limitAmount = formatWholeAmount(convertFromMicroUnits(limit), currencySymbol);

    return {
        limitLabel: t`Limit ${limitAmount}`,
        endLabel: isOver ? t`${projectedAmount} · ${gapAmount} over` : t`${projectedAmount} · ${gapAmount} under`
    };
};
