import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_ICON } from '../../constant/budget-pace-icon.constant';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetWidgetCategoryList } from '../budget-widget-category-list/budget-widget-category-list';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

const STATUS_ICON_SIZE = 16;

export const BudgetWidgetCard = ({ budget }: Props) => {
    const { t } = useLingui();
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { spent } = useGetBudgetSpentQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budget.id);
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { overall, daysLeft } = projection;
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const labels = useBudgetProgressLabels(overall.spent, overall.limit, currencySymbol, 0);

    const handleNavigate = () => void router.push('/budget');

    const dateLabel = formatBudgetPeriodLabel(budget, formatMonthAndDay);
    const statusClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[overall.status]];
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[overall.status]);
    const safePerDayAmount = formatProtectedAmount(convertFromMicroUnits(overall.safePerDay), currencySymbol);
    const freeAmount = formatProtectedAmount(convertFromMicroUnits(Math.max(overall.free, 0)), currencySymbol);
    const daysLabel = t({ message: plural(daysLeft, { one: '# day', other: '# days' }) });
    const freeLabel = t`${freeAmount} free · ${daysLabel}`;

    return (
        <Card testID={BudgetSelector.WidgetCard} variant="ghost" size="md" onPress={handleNavigate} className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-medium text-md">
                    <Trans>Monthly budget</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">{dateLabel}</Text>
            </View>

            <LoadingContent isLoading={isLoading} className="gap-y-md">
                <View className="flex-row items-center justify-between gap-x-md">
                    <View className="flex-row items-baseline gap-x-sm shrink">
                        <ProtectedText className="text-primary text-2xl font-bold tabular-nums">{safePerDayAmount}</ProtectedText>
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>/ day</Trans>
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-x-xs">
                        <Icon icon={BUDGET_PACE_ICON[overall.status]} size={STATUS_ICON_SIZE} className={cn(statusClassName)} />
                        <Text className={cn('text-sm font-semibold', statusClassName)}>{statusLabel}</Text>
                    </View>
                </View>

                <BudgetPaceTrack scope={overall} />

                <View className="flex-row items-center justify-between gap-x-md">
                    <ProtectedText testID={BudgetSelector.WidgetSpentLabel} className="text-secondary-foreground text-sm tabular-nums">
                        {labels.amountLabel}
                    </ProtectedText>
                    <Text testID={BudgetSelector.WidgetRemainingLabel} className="text-secondary-foreground text-sm tabular-nums">
                        {freeLabel}
                    </Text>
                </View>
            </LoadingContent>

            <BudgetWidgetCategoryList categoryLimits={categoryLimits} spentByCategory={spent.spentByCategory} />
        </Card>
    );
};
