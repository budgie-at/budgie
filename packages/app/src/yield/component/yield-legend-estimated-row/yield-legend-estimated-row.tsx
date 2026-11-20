import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ESTIMATED_KEY = 'ESTIMATED';

export const YieldLegendEstimatedRow = () => {
    const summary = useYieldSummary();

    const hasEstimated = summary?.buckets.some(bucket => bucket.isEstimated) === true;

    if (!hasEstimated) {
        return null;
    }

    return (
        <View accessible testID={PassiveIncomeSelector.LegendRow(ESTIMATED_KEY)} className="flex-row items-center gap-x-xs">
            <View className="h-[8px] w-[8px] rounded-full border-[1.5px] border-secondary-foreground bg-secondary-foreground/25" />
            <Text className="text-[13px] text-secondary-foreground">
                <Trans>Estimated price</Trans>
            </Text>
        </View>
    );
};
