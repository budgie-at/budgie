import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetWidgetFooterRow = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { overall, daysLeft } = projection;
    const labels = useBudgetProgressLabels(overall.spent, overall.limit, currencySymbol, 0);
    const freeAmount = formatProtectedAmount(convertFromMicroUnits(Math.max(overall.free, 0)), currencySymbol);
    const daysLabel = t({ message: plural(daysLeft, { one: '# day', other: '# days' }) });
    const freeLabel = t`${freeAmount} free for ${daysLabel}`;

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <ProtectedText testID={BudgetSelector.WidgetSpentLabel} className="text-secondary-foreground text-xs tabular-nums">
                {labels.amountLabel}
            </ProtectedText>
            <Text testID={BudgetSelector.WidgetRemainingLabel} className="text-secondary-foreground text-xs tabular-nums">
                {freeLabel}
            </Text>
        </View>
    );
};
