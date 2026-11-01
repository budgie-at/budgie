import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly footnote: ReactNode;
}

export const BudgetPeriodSummaryTotal = ({ title, spent, limit, currencySymbol, footnote }: Props) => {
    const formatDigits = useFormatDigits(0);
    const tone = spent > limit ? 'destructive' : 'positive';

    return (
        <View className="gap-y-md" collapsable={false} testID={BudgetSelector.PeriodSummaryOverall}>
            <Text className="text-sm text-secondary-foreground">{title}</Text>
            <View className="flex-row items-baseline gap-x-xs">
                <ProtectedText
                    testID={BudgetSelector.PeriodSummaryOverallSpentLabel}
                    className="text-3xl font-semibold tabular-nums text-primary"
                >
                    {formatDigits(convertFromMicroUnits(spent), currencySymbol)}
                </ProtectedText>
                <ProtectedText className="text-lg tabular-nums text-secondary-foreground">
                    / {formatDigits(convertFromMicroUnits(limit), currencySymbol)}
                </ProtectedText>
            </View>
            <BudgetLimitBar spent={spent} limit={limit} tone={tone} />
            {footnote}
        </View>
    );
};
