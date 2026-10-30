import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getCategorizeInboxMonthlyCounts } from '../../utils/get-categorize-inbox-monthly-counts.util';
import { CategorizeInboxGroupStatsLine } from '../categorize-inbox-group-stats-line/categorize-inbox-group-stats-line';
import { CategorizeInboxMonthlyBars } from '../categorize-inbox-monthly-bars/categorize-inbox-monthly-bars';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxGroupPanel = ({ cluster }: Props) => {
    const { formatShortMonth, formatMonthAndYear } = useFormatDate();

    const buckets = getCategorizeInboxMonthlyCounts(cluster.rows);
    const firstBucket = buckets.at(0);
    const lastBucket = buckets.at(-1);
    const spansYears =
        isDefined(firstBucket) && isDefined(lastBucket) && firstBucket.month.getFullYear() !== lastBucket.month.getFullYear();
    const formatBucketMonth = spansYears ? formatMonthAndYear : formatShortMonth;
    const firstMonth = isDefined(firstBucket) ? formatBucketMonth(firstBucket.month) : '';
    const lastMonth = isDefined(lastBucket) ? formatBucketMonth(lastBucket.month) : '';

    const barClassName = cluster.section === CategorizeInboxSectionEnum.CONFIDENT ? 'bg-positive-fill/70' : 'bg-secondary-foreground/50';

    return (
        <View className="mt-5xl gap-y-xl rounded-3xl bg-surface-row px-3xl py-xl" style={CONTINUOUS_CORNERS}>
            <Text className="text-secondary-foreground text-[13px]">
                <Trans>Payments per month</Trans>
            </Text>

            <View className="gap-y-sm">
                <CategorizeInboxMonthlyBars buckets={buckets} barClassName={barClassName} />
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-[12px]">{firstMonth}</Text>
                    <Text className="text-secondary-foreground text-[12px]">{lastMonth}</Text>
                </View>
            </View>

            <View className="h-hairline bg-surface-separator" />

            <CategorizeInboxGroupStatsLine cluster={cluster} />
        </View>
    );
};
