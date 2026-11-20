import { UserIconNameEnum } from '@budgie/contracts';
import { YieldRangeEnum } from '@budgie/market';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { yieldRangeAtom } from '../../constant/yield-range-atom.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldOlderPayoutsRow = () => {
    const setRange = useAtomSet(yieldRangeAtom);
    const { cancelScrub } = use(YieldSelectionContext);

    const handlePress = () => {
        cancelScrub();
        setRange(YieldRangeEnum.ALL);
        router.setParams({ range: YieldRangeEnum.ALL, focus: '' });
    };

    return (
        <HapticPressable
            accessibilityRole="button"
            onPress={handlePress}
            className="min-h-[44px] flex-row items-center justify-center gap-x-xs px-3xl pt-lg active:opacity-70"
            testID={PassiveIncomeSelector.OlderPayouts}
        >
            <Text className="text-[15px] text-secondary-foreground">
                <Trans>Older payouts · All time</Trans>
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
