import { YieldRangeEnum } from '@budgie/market';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { yieldRangeAtom } from '../../constant/yield-range-atom.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const SEE_ALL_HIT_SLOP = 12;

export const YieldChartSeeAllTime = () => {
    const setRange = useAtomSet(yieldRangeAtom);

    const handlePress = () => {
        setRange(YieldRangeEnum.ALL);
        router.setParams({ range: YieldRangeEnum.ALL });
    };

    return (
        <Pressable accessibilityRole="button" hitSlop={SEE_ALL_HIT_SLOP} onPress={handlePress} testID={PassiveIncomeSelector.SeeAllTime}>
            <Text className="text-md font-semibold text-primary">
                <Trans>See all time</Trans>
            </Text>
        </Pressable>
    );
};
