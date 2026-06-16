import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetEmptyState } from '../budget-empty-state/budget-empty-state';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { BudgetWidgetCategoryList } from '../budget-widget-category-list/budget-widget-category-list';

export const BudgetWidget = () => {
    const isEnabled = useSetting('isBudgetWidgetEnabled');
    const { budget } = useGetActiveBudgetQuery();
    const { spent } = useGetBudgetSpentQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(isDefined(budget) ? budget.instrumentId : 0);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(isDefined(budget) ? budget.id : null);
    const { formatMonthAndDay } = useFormatDate();

    if (!isEnabled) {
        return null;
    }

    if (!isDefined(budget)) {
        return <BudgetEmptyState testID={BudgetSelector.WidgetEmptyState} />;
    }

    const handleNavigate = () => void router.push('/budget');

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, formatMonthAndDay);

    return (
        <Card testID={BudgetSelector.WidgetCard} variant="ghost" onPress={handleNavigate} className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-medium text-md">
                    <Trans>Monthly budget</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">{dateLabel}</Text>
            </View>

            <BudgetProgressBar
                amountDecimalPlaces={0}
                currencySymbol={currencySymbol}
                isAmountLight
                isCompact
                spent={spent.spentOverall}
                limit={budget.overallLimit}
                spentTestID={BudgetSelector.WidgetSpentLabel}
                remainingTestID={BudgetSelector.WidgetRemainingLabel}
            />

            <BudgetWidgetCategoryList categoryLimits={categoryLimits} spentByCategory={spent.spentByCategory} />
        </Card>
    );
};
