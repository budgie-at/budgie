import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getCategorizeInboxMonthlyCounts } from '../../utils/get-categorize-inbox-monthly-counts.util';
import { CategorizeInboxGroupStats } from '../categorize-inbox-group-stats/categorize-inbox-group-stats';
import { CategorizeInboxMonthlyBars } from '../categorize-inbox-monthly-bars/categorize-inbox-monthly-bars';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

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

    const barClassName = cluster.section === CategorizeInboxSectionEnum.CONFIDENT ? 'bg-positive-fill' : 'bg-secondary-foreground';

    return (
        <View className="bg-secondary-background gap-y-lg rounded-3xl p-xl">
            <Text className="text-secondary-foreground text-xs">
                <Trans>Payments per month</Trans>
            </Text>

            <View className="gap-y-xs">
                <CategorizeInboxMonthlyBars buckets={buckets} barClassName={barClassName} />
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-[11px]">{firstMonth}</Text>
                    <Text className="text-secondary-foreground text-[11px]">{lastMonth}</Text>
                </View>
            </View>

            <CategorizeInboxGroupStats cluster={cluster} />
        </View>
    );
};
