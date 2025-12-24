import React from 'react';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { ICONS } from '../../constant/icons.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly drag: SharedValue<number>;
    readonly onPress: () => void;
}

export const DeletableRowAction = ({ drag, onPress }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    return (
        <Reanimated.View style={styleAnimation}>
            <HapticPressable onPress={onPress} className="justify-center items-center w-[70px] h-full">
                <Icon className="text-primary" icon={ICONS.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
