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
    const { formatShortMonth } = useFormatDate();

    const buckets = getCategorizeInboxMonthlyCounts(cluster.rows);
    const firstBucket = buckets.at(0);
    const lastBucket = buckets.at(-1);
    const firstMonth = isDefined(firstBucket) ? formatShortMonth(firstBucket.month) : '';
    const lastMonth = isDefined(lastBucket) ? formatShortMonth(lastBucket.month) : '';

    return (
        <View className="bg-secondary-background gap-y-xl rounded-3xl p-xl">
            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-xs">
                    <Trans>Payments per month</Trans>
                </Text>
                <Text className="text-secondary-foreground text-xs">
                    <Trans>
                        {firstMonth} to {lastMonth}
                    </Trans>
                </Text>
            </View>

            <CategorizeInboxMonthlyBars buckets={buckets} />

            <CategorizeInboxGroupStats cluster={cluster} />
        </View>
    );
};
