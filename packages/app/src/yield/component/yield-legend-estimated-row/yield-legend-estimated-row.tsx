import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ESTIMATED_KEY = 'ESTIMATED';

export const YieldLegendEstimatedRow = () => (
    <View accessible className="pl-[20px]" testID={PassiveIncomeSelector.LegendRow(ESTIMATED_KEY)}>
        <Text className="text-sm text-secondary-foreground">
            <Trans>≈ Includes estimated prices</Trans>
        </Text>
    </View>
);
