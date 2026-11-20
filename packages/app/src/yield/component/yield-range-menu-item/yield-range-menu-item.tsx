import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useActionsMenuClose } from '../../../@generic/context/actions-menu.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldRangeEnum } from '@budgie/market';

interface Props {
    readonly range: YieldRangeEnum;
    readonly label: string;
    readonly isCurrent: boolean;
    readonly onSelect: (range: YieldRangeEnum) => void;
}

export const YieldRangeMenuItem = ({ range, label, isCurrent, onSelect }: Props) => {
    const closeMenu = useActionsMenuClose();

    const accessibilityState = { selected: isCurrent };

    const handlePress = () => void closeMenu(() => void onSelect(range));

    return (
        <HapticPressable
            pressedScale={1}
            onPress={handlePress}
            className="min-h-[44px] flex-row items-center justify-between gap-x-lg px-xl py-lg active:bg-secondary-background"
            accessibilityRole="menuitem"
            accessibilityState={accessibilityState}
            testID={PassiveIncomeSelector.Range(range)}
        >
            <Text className="shrink text-base font-medium text-primary">{label}</Text>
            {isCurrent ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
        </HapticPressable>
    );
};
