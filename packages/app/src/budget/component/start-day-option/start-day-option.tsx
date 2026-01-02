import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

const buttonVariants = cva('px-3 py-2 rounded-xl border', {
    variants: {
        selected: { true: 'bg-primary border-primary', false: 'bg-secondary-background border-secondary-corner' },
        wide: { true: 'px-4', false: '' }
    }
});

const textVariants = cva('text-sm font-medium', {
    variants: { selected: { true: 'text-primary-reverse', false: 'text-secondary-foreground' } }
});

interface Props {
    readonly label: string;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly wide?: boolean;
}

export const StartDayOption = ({ label, isSelected, onPress, wide = false }: Props) => (
    <HapticPressable onPress={onPress} className={buttonVariants({ selected: isSelected, wide })}>
        <Text className={textVariants({ selected: isSelected })}>{label}</Text>
    </HapticPressable>
);

