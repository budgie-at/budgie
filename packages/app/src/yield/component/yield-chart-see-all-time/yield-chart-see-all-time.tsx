import { YieldRangeEnum } from '@budgie/market';
import { Trans } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';

import { useYieldRangeChange } from '../../hook/use-yield-range-change.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const SEE_ALL_HIT_SLOP = 12;

export const YieldChartSeeAllTime = () => {
    const changeRange = useYieldRangeChange();

    const handlePress = () => void changeRange(YieldRangeEnum.ALL);

    return (
        <Pressable
            accessibilityRole="button"
            className="min-h-[44px] justify-center"
            hitSlop={SEE_ALL_HIT_SLOP}
            onPress={handlePress}
            testID={PassiveIncomeSelector.SeeAllTime}
        >
            <Text className="text-md font-semibold text-positive-action">
                <Trans>See all time</Trans>
            </Text>
        </Pressable>
    );
};
