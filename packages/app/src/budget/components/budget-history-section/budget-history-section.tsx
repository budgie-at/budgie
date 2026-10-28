import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetPeriodSnapshotsQuery } from '../../query/use-get-budget-period-snapshots.query';
import { buildBudgetHistoryBars } from '../../utils/build-budget-history-bars.util';
import { getBudgetPeriodLabelDate } from '../../utils/get-budget-period-label-date.util';
import { BudgetHistoryChart } from '../budget-history-chart/budget-history-chart';

interface Props {
    readonly budgetId: number;
    readonly overallLimit: number;
    readonly currentSpent: number;
    readonly currentPeriodStart: Date;
    readonly currentPeriodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetHistorySection = ({
    budgetId,
    overallLimit,
    currentSpent,
    currentPeriodStart,
    currentPeriodEnd,
    currencySymbol
}: Props) => {
    const { snapshots } = useGetBudgetPeriodSnapshotsQuery(budgetId);
    const { formatShortMonth } = useFormatDate();
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    if (isEmptyArray(snapshots)) {
        return null;
    }

    const totalCount = snapshots.length;
    const onBudgetCount = snapshots.filter(snapshot => snapshot.overallSpent <= snapshot.overallLimit).length;
    const averageSpent = Math.round(snapshots.reduce((total, snapshot) => total + snapshot.overallSpent, 0) / totalCount);
    const averageAmount = formatDigits(convertFromMicroUnits(averageSpent), currencySymbol);
    const currentBar = {
        key: 'current',
        label: formatShortMonth(getBudgetPeriodLabelDate(currentPeriodStart, currentPeriodEnd)),
        spent: currentSpent,
        limit: overallLimit,
        isCurrent: true,
        isEstimated: false,
        snapshotId: null
    };
    const bars = buildBudgetHistoryBars(snapshots, currentBar, formatShortMonth);
    const hasEstimatedPeriods = snapshots.some(snapshot => snapshot.isReconstructed);

    return (
        <View className="gap-y-md" testID={BudgetSelector.DetailsHistorySection}>
            <Text className="text-primary text-lg font-semibold">{t`Past months`}</Text>

            <Card variant="ghost" size="md" className="gap-y-xl">
                <View className="flex-row items-center justify-between gap-x-md">
                    <Text className="text-primary text-md font-semibold flex-1">
                        {t({
                            message: plural(totalCount, {
                                one: `On budget ${onBudgetCount} of # month`,
                                other: `On budget ${onBudgetCount} of # months`
                            })
                        })}
                    </Text>
                    <MetaPill label={t`Avg ${averageAmount}`} />
                </View>

                <BudgetHistoryChart bars={bars} />
            </Card>

            {hasEstimatedPeriods ? (
                <Text className="text-secondary-foreground text-xs">
                    {t`Faded bars are estimated from your past transactions using your current limits.`}
                </Text>
            ) : null}
        </View>
    );
};
