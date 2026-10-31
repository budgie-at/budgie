import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedWholeAmountLabel } from '../../@generic/hook/use-protected-whole-amount-label.hook';

import type { BudgetForecastDomainInterface } from '../interface/budget-forecast-domain.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

export const useBudgetForecastLabels = (
    scope: Pick<BudgetProjectionScopeInterface, 'limit' | 'projectedEnd'>,
    currencySymbol: string,
    domain: BudgetForecastDomainInterface
) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { limit, projectedEnd } = scope;
    const isOver = isDefined(projectedEnd) && projectedEnd > limit;
    const gapAmount = formatWholeAmount(convertFromMicroUnits(Math.abs(limit - (projectedEnd ?? limit))), currencySymbol);
    const projectedAmount = formatWholeAmount(convertFromMicroUnits(projectedEnd ?? limit), currencySymbol);
    const limitAmount = formatWholeAmount(convertFromMicroUnits(limit), currencySymbol);
    const scaleAmount = formatWholeAmount(convertFromMicroUnits(domain.maxValue), currencySymbol);

    return {
        limitLabel: domain.isLimitInRange ? t`Limit ${limitAmount}` : t`Limit ${limitAmount} · above chart`,
        scaleLabel: t`Chart max ${scaleAmount}`,
        endLabel: isOver ? t`${projectedAmount} · ${gapAmount} over` : t`${projectedAmount} · ${gapAmount} under`
    };
};
