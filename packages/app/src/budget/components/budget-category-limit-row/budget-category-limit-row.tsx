import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { buildBudgetCategoryLimitMetrics } from '../../utils/build-budget-category-limit-metrics.util';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

const WIDGET_AMOUNT_DECIMAL_PLACES = 0;

interface Props {
    readonly categoryId: number;
    readonly currencySymbol: string;
    readonly limitAmount: number;
    readonly spent: number;
    readonly testID?: string;
    readonly spentTestID?: string;
}

export const BudgetCategoryLimitRow = ({ categoryId, currencySymbol, limitAmount, spent, testID, spentTestID }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);
    const { t } = useLingui();
    const metrics = buildBudgetCategoryLimitMetrics(spent, limitAmount);
    const formatDigits = useFormatDigits(WIDGET_AMOUNT_DECIMAL_PLACES);
    const remainingLabel = metrics.isOverBudget ? t`Over budget` : t`Left`;
    const title = category?.title ?? '';
    const spentLabel = formatDigits(metrics.displaySpent, currencySymbol);
    const limitLabel = formatDigits(metrics.displayLimit, currencySymbol);
    const remainingAmountLabel = formatDigits(metrics.displayRemaining, currencySymbol);

    return (
        <View testID={testID} collapsable={false} className="flex-row items-center gap-x-md">
            {isDefined(category) && <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />}

            <View className="flex-1 gap-y-sm">
                <Text className="text-primary text-sm font-medium">{title}</Text>
                <BudgetProgressBar isAmountLight isSummaryVisible={false} spent={spent} limit={limitAmount} />
                <View className="flex-row justify-between gap-x-sm">
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xxs">{t`Spent`}</Text>
                        <Text testID={spentTestID} className="text-primary text-xs font-medium">
                            {spentLabel}
                        </Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-secondary-foreground text-xxs">{remainingLabel}</Text>
                        <Text className="text-primary text-xs font-medium">{remainingAmountLabel}</Text>
                    </View>
                    <View className="flex-1 items-end">
                        <Text className="text-secondary-foreground text-xxs">{t`Limit`}</Text>
                        <Text className="text-primary text-xs font-medium">{limitLabel}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
