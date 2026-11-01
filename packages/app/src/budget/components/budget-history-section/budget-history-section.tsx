import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PERIOD_PAST_LABEL } from '../../constant/budget-period-past-label.constant';
import { useFormatBudgetPeriod } from '../../hooks/use-format-budget-period.hook';
import { useGetBudgetPeriodSnapshotsQuery } from '../../query/use-get-budget-period-snapshots.query';
import { buildBudgetHistoryBars } from '../../utils/build-budget-history-bars.util';
import { BudgetHistoryChart } from '../budget-history-chart/budget-history-chart';
import { BudgetHistoryLegend } from '../budget-history-legend/budget-history-legend';

import type { BudgetPeriodEnum } from '@budgie/contracts';

interface Props {
    readonly budgetId: number;
    readonly period: BudgetPeriodEnum;
    readonly overallLimit: number;
    readonly currentSpent: number;
    readonly currentPeriodStart: Date;
    readonly currentPeriodEnd: Date;
    readonly currencySymbol: string;
}

const MIN_CLOSED_PERIODS = 2;

export const BudgetHistorySection = (props: Props) => {
    const { budgetId, period, overallLimit, currentSpent, currentPeriodStart, currentPeriodEnd, currencySymbol } = props;
    const { snapshots } = useGetBudgetPeriodSnapshotsQuery(budgetId);
    const { formatShortPeriod } = useFormatBudgetPeriod();
    const { t } = useLingui();

    if (snapshots.length < MIN_CLOSED_PERIODS) {
        return null;
    }

    const totalCount = snapshots.length;
    const onBudgetCount = snapshots.filter(snapshot => snapshot.overallSpent <= snapshot.overallLimit).length;
    const currentBar = {
        key: 'current',
        label: formatShortPeriod(period, currentPeriodStart, currentPeriodEnd),
        spent: currentSpent,
        limit: overallLimit,
        isCurrent: true,
        isEstimated: false,
        snapshotId: null
    };
    const bars = buildBudgetHistoryBars(snapshots, currentBar, (periodStart, periodEnd) =>
        formatShortPeriod(period, periodStart, periodEnd)
    );
    const hasEstimatedPeriods = snapshots.some(snapshot => snapshot.isReconstructed);

    return (
        <EntranceReveal step={5}>
            <View collapsable={false} className="gap-y-lg" testID={BudgetSelector.DetailsHistorySection}>
                <SectionHeader label={t(BUDGET_PERIOD_PAST_LABEL[period])} />

                <BudgetHistoryChart bars={bars} currencySymbol={currencySymbol} />

                <BudgetHistoryLegend bars={bars} />

                <Text className="text-xs text-secondary-foreground">
                    {t({
                        message: plural(totalCount, {
                            one: `On budget ${onBudgetCount} of # period`,
                            other: `On budget ${onBudgetCount} of # periods`
                        })
                    })}
                </Text>

                {hasEstimatedPeriods ? (
                    <Text className="text-xxs text-secondary-foreground">
                        {t`Faded bars are estimated from your past transactions using your current limits.`}
                    </Text>
                ) : null}
            </View>
        </EntranceReveal>
    );
};
