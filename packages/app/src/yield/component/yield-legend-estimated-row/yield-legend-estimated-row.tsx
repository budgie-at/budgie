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
        <View accessible testID={PassiveIncomeSelector.LegendRow(ESTIMATED_KEY)}>
            <Text className="text-xs text-secondary-foreground">
                <Trans>≈ Includes estimated prices</Trans>
            </Text>
        </View>
    );
};
