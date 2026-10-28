import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
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

    return (
        <Card size="md" className="flex-row items-center">
            <StatCell label={t`Spent`} value={formatAmount(scope.spent)} variant="primary" testID={BudgetSelector.DetailsSpentLabel} />
            <View className="h-8 w-px bg-secondary-corner" />
            <StatCell
                label={t`Left`}
                value={formatAmount(scope.free)}
                variant={leftVariant}
                testID={BudgetSelector.DetailsRemainingLabel}
            />
            <View className="h-8 w-px bg-secondary-corner" />
            <StatCell label={t`Limit`} value={formatAmount(scope.limit)} variant="primary" testID={BudgetSelector.DetailsLimitLabel} />
        </Card>
    );
};
