import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import { DeletableRowSelector } from './deletable-row.selector';

import type { DeletableRowVariant } from '../../type/deletable-row-variant.type';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

interface Props {
    readonly drag: SharedValue<number>;
    readonly isOpen: boolean;
    readonly label: string;
    readonly variant: DeletableRowVariant;
    readonly onPress: () => void;
}

const pressableVariants = cva('h-full w-[70px]', { variants: { variant: { pill: 'py-xxs pl-sm', fill: '' } } });

const fillVariants = cva('flex-1 items-center justify-center bg-destructive-fill active:opacity-80', {
    variants: { variant: { pill: 'rounded-2xl', fill: '' } }
});

export const DeletableRowAction = ({ drag, isOpen, label, variant, onPress }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    const containerStyle = isOpen ? null : styleAnimation;

    return (
        <Reanimated.View style={containerStyle}>
            <HapticPressable
                testID={DeletableRowSelector.DeleteButton}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
                className={pressableVariants({ variant })}
            >
                <View className={fillVariants({ variant })} style={CONTINUOUS_CORNERS}>
                    <Icon className="text-white" icon={UserIconNameEnum.Trash2} />
                </View>
            </HapticPressable>
        </Reanimated.View>
    );
};
