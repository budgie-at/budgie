import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isIncrease: boolean;
    readonly onChange: (isIncrease: boolean) => void;
}

const increaseButtonVariants = cva('flex-1 flex-row items-center justify-center gap-sm rounded-2xl border py-md', {
    variants: {
        selected: {
            true: 'bg-positive-background border-positive-border',
            false: 'bg-ghost-background border-border'
        }
    }
});

const decreaseButtonVariants = cva('flex-1 flex-row items-center justify-center gap-sm rounded-2xl border py-md', {
    variants: {
        selected: {
            true: 'bg-destructive-background border-destructive-border',
            false: 'bg-ghost-background border-border'
        }
    }
});

const increaseIconVariants = cva('', {
    variants: {
        selected: {
            true: 'text-positive-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

const decreaseIconVariants = cva('', {
    variants: {
        selected: {
            true: 'text-destructive-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

export const AdjustmentSignToggle = ({ isIncrease, onChange }: Props) => {
    const handleIncreasePress = () => void onChange(true);
    const handleDecreasePress = () => void onChange(false);

    return (
        <View className="flex-row gap-md">
            <HapticPressable
                className={increaseButtonVariants({ selected: isIncrease })}
                onPress={handleIncreasePress}
                accessibilityRole="button"
            >
                <Icon icon={UserIconNameEnum.Plus} size={18} className={increaseIconVariants({ selected: isIncrease })} />
            </HapticPressable>
            <HapticPressable
                className={decreaseButtonVariants({ selected: !isIncrease })}
                onPress={handleDecreasePress}
                accessibilityRole="button"
            >
                <Icon icon={UserIconNameEnum.Minus} size={18} className={decreaseIconVariants({ selected: !isIncrease })} />
            </HapticPressable>
        </View>
    );
};
