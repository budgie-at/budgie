import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { getCategorizeInboxMonthlyCounts } from '../../utils/get-categorize-inbox-monthly-counts.util';
import { hasCategorizeInboxMonthlyVariation } from '../../utils/has-categorize-inbox-monthly-variation.util';
import { CategorizeInboxGroupStatsLine } from '../categorize-inbox-group-stats-line/categorize-inbox-group-stats-line';
import { CategorizeInboxMonthlyBars } from '../categorize-inbox-monthly-bars/categorize-inbox-monthly-bars';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxGroupPanel = ({ cluster }: Props) => {
    if (!hasCategorizeInboxMonthlyVariation(cluster.rows)) {
        return null;
    }

    return (
        <View className="mt-5xl gap-y-xl rounded-3xl bg-surface-row px-3xl py-xl" style={CONTINUOUS_CORNERS}>
            <Text className="text-primary text-[15px] font-semibold" accessibilityRole="header">
                <Trans>Payments per month</Trans>
            </Text>

            <CategorizeInboxMonthlyBars buckets={getCategorizeInboxMonthlyCounts(cluster.rows)} />

            <View className="h-hairline bg-surface-separator" />

            <CategorizeInboxGroupStatsLine cluster={cluster} />
        </View>
    );
};
