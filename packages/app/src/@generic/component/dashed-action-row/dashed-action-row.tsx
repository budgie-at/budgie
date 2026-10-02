import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: EmptyFn;
    readonly children: ReactNode;
    readonly testID?: string;
}

const ICON_SIZE = 20;

export const DashedActionRow = ({ icon, onPress, children, testID }: Props) => (
    <HapticPressable
        className="flex-row items-center justify-center gap-x-md py-xl mt-md rounded-3xl border-2 border-dashed border-secondary-corner"
        onPress={onPress}
        accessibilityRole="button"
        testID={testID}
    >
        <Icon icon={icon} size={ICON_SIZE} className="text-primary" />
        <Text className="text-sm font-semibold text-primary">{children}</Text>
    </HapticPressable>
);
