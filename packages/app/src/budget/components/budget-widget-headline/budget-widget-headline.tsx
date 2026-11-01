import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatBudgetAmount } from '../../hooks/use-format-budget-amount.hook';
import { buildBudgetProgressBarMetrics } from '../../utils/build-budget-progress-bar-metrics.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const ROUNDED_FONT = { fontFamily: 'ui-rounded' } as const;

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetWidgetHeadline = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatBudgetAmount = useFormatBudgetAmount();
    const formatWhole = useFormatDigits(0);
    const metrics = buildBudgetProgressBarMetrics(scope.spent, scope.limit);
    const remainingAmount = formatBudgetAmount(metrics.displayRemaining, currencySymbol);
    const limitAmount = formatWhole(metrics.displayLimit, currencySymbol);
    const caption = metrics.isOverBudget ? t`above ${limitAmount} limit` : t`left of ${limitAmount}`;
    const amountClassName = metrics.isOverBudget && !isAmountProtected ? 'text-destructive-ink' : 'text-primary';

    return (
        <View className="flex-row flex-wrap items-baseline gap-x-sm">
            <ProtectedText style={ROUNDED_FONT} className={cn('text-3xl font-bold', amountClassName)} numberOfLines={1}>
                {remainingAmount}
            </ProtectedText>
            <ProtectedText className="shrink text-md font-medium text-secondary-foreground" numberOfLines={1}>
                {caption}
            </ProtectedText>
        </View>
    );
};
