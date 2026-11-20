import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useYieldIsEstimated } from '../../hook/use-yield-is-estimated.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ESTIMATED_KEY = 'ESTIMATED';

export const YieldLegendEstimatedRow = () => {
    const isEstimated = useYieldIsEstimated(useYieldSummary());

    if (!isEstimated) {
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
