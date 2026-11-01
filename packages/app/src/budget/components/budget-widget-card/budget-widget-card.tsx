import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetEffectiveLimitsQuery } from '../../query/use-get-budget-effective-limits.query';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetStatusLabel } from '../budget-status-label/budget-status-label';
import { BudgetWidgetCategoryList } from '../budget-widget-category-list/budget-widget-category-list';
import { BudgetWidgetFooterRow } from '../budget-widget-footer-row/budget-widget-footer-row';
import { BudgetWidgetHeadline } from '../budget-widget-headline/budget-widget-headline';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetWidgetCard = ({ budget }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { spent } = useGetBudgetSpentQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const effectiveLimits = useGetBudgetEffectiveLimitsQuery(budget);
    const { formatMonthAndDay } = useFormatDate();
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const periodLabel = formatBudgetPeriodLabel(budget, formatMonthAndDay);

    const handleNavigate = () => void router.push('/budget');

    return (
        <Card testID={BudgetSelector.WidgetCard} variant="primary" size="md" onPress={handleNavigate} className="gap-y-md">
            <View className="flex-row items-center justify-between gap-x-md">
                <BudgetStatusLabel status={projection.overall.status} />
                <Text className="shrink text-secondary-foreground text-xs" numberOfLines={1}>
                    {periodLabel}
                </Text>
            </View>

            <LoadingContent isLoading={isLoading} className="gap-y-md">
                <BudgetWidgetHeadline scope={projection.overall} currencySymbol={currencySymbol} />

                <BudgetPaceTrack scope={projection.overall} />

                <BudgetWidgetFooterRow projection={projection} currencySymbol={currencySymbol} />
            </LoadingContent>

            <BudgetWidgetCategoryList categoryLimits={effectiveLimits.categoryLimits} spentByCategory={spent.spentByCategory} />
        </Card>
    );
};
