import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { buildBudgetCategoryLimitMetrics } from '../../utils/build-budget-category-limit-metrics.util';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
}

export const BudgetDetailsCategoryRow = (props: Props) => {
    const { categoryId, limitAmount, spent, periodStart, periodEnd, currencySymbol, testID, spentTestID } = props;
    const { category } = useGetCategoryByIdQuery(categoryId);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { t } = useLingui();

    const metrics = buildBudgetCategoryLimitMetrics(spent, limitAmount);
    const remainingLabel = metrics.isOverBudget ? t`Over budget` : t`Left`;
    const title = category?.title ?? '';

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                type: TransactionTypeEnum.EXPENSE,
                categoryId: String(categoryId),
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    return (
        <Card testID={testID} variant="ghost" size="md" onPress={handlePress} className="gap-y-md">
            <View className="flex-row items-center gap-x-md">
                {isDefined(category) ? <CircleIcon icon={category.icon} variant="ghost" size={40} iconSize={18} /> : null}

                <Text className="text-primary text-md font-semibold flex-1" numberOfLines={1}>
                    {title}
                </Text>
            </View>

            <BudgetProgressBar isSummaryVisible={false} spent={spent} limit={limitAmount} />

            <View className="flex-row justify-between gap-x-md">
                <View className="flex-1">
                    <Text className="text-secondary-foreground text-xs">{t`Spent`}</Text>
                    <Text testID={spentTestID} className="text-primary text-sm font-semibold">
                        {formatDigits(metrics.displaySpent, currencySymbol)}
                    </Text>
                </View>
                <View className="flex-1 items-center">
                    <Text className="text-secondary-foreground text-xs">{remainingLabel}</Text>
                    <Text className="text-primary text-sm font-semibold">{formatDigits(metrics.displayRemaining, currencySymbol)}</Text>
                </View>
                <View className="flex-1 items-end">
                    <Text className="text-secondary-foreground text-xs">{t`Limit`}</Text>
                    <Text className="text-primary text-sm font-semibold">{formatDigits(metrics.displayLimit, currencySymbol)}</Text>
                </View>
            </View>
        </Card>
    );
};
