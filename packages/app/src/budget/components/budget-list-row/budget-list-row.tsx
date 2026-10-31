import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly testID: string;
    readonly onPress: () => void;
    readonly children: ReactNode;
}

export const BudgetListRow = ({ testID, onPress, children }: Props) => (
    <HapticPressable
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-x-md py-xs active:opacity-70"
        testID={testID}
        onPress={onPress}
    >
        <View className="flex-1 gap-y-sm">{children}</View>
        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
    </HapticPressable>
);
