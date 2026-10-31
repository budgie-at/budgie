import { ReactNode } from 'react';
import { View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly testID: string;
    readonly onPress: () => void;
    readonly children: ReactNode;
}

export const BudgetListRow = ({ icon, testID, onPress, children }: Props) => (
    <HapticPressable
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-x-xl py-xs active:opacity-70"
        testID={testID}
        onPress={onPress}
    >
        <GroupedListIcon icon={icon} />
        <View className="flex-1 gap-y-sm">{children}</View>
    </HapticPressable>
);
