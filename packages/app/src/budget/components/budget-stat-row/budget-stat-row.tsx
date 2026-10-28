import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HairlineStatRow } from '../../../@generic/component/hairline-stat-row/hairline-stat-row';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetStatRow = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const leftVariant = scope.free < 0 ? 'destructive' : 'positive';

    const formatAmount = (amount: number) => formatDigits(convertFromMicroUnits(amount), currencySymbol);

    const stats = [
        { label: t`Spent`, value: formatAmount(scope.spent), variant: 'primary', testID: BudgetSelector.DetailsSpentLabel },
        { label: t`Left`, value: formatAmount(scope.free), variant: leftVariant, testID: BudgetSelector.DetailsRemainingLabel },
        { label: t`Limit`, value: formatAmount(scope.limit), variant: 'primary', testID: BudgetSelector.DetailsLimitLabel }
    ] as const;

    return <HairlineStatRow stats={stats} />;
};
