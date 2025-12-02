import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly icon: IconName;
    readonly label: string;
}

const cardVariants = cva('flex-row items-center gap-x-md border-2 rounded-5xl p-2xl', {
    variants: {
        isSelected: {
            true: 'border-secondary-corner bg-secondary-background',
            false: 'border-secondary-corner/50'
        }
    }
});

export const TransactionFilterCard = ({ isSelected, onPress, icon, label }: Props) => (
    <HapticPressable onPress={onPress} className={cardVariants({ isSelected })}>
        <Icon icon={ICONS[icon]} size={16} className="text-primary" />
        <Text className="text-primary font-medium text-sm">{label}</Text>
    </HapticPressable>
);
