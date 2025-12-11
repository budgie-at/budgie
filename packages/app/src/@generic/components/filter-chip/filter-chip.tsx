import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly label: string;
    readonly icon: IconName;
    readonly onPress: EmptyFn;
}

export const FilterChip = ({ label, onPress, icon }: Props) => (
    <HapticPressable className="rounded-2xl border border-secondary-corner px-xl flex-row items-center gap-x-sm py-sm" onPress={onPress}>
        <Icon icon={ICONS[icon]} className="text-secondary-foreground" size={14} />
        <Text className="text-xs text-secondary-foreground">{label}</Text>
    </HapticPressable>
);
