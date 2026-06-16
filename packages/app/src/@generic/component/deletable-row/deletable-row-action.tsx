import { UserIconNameEnum } from '@budgie/contracts';
import React from 'react';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import { DeletableRowSelector } from './deletable-row.selector';

interface Props {
    readonly drag: SharedValue<number>;
    readonly isOpen: boolean;
    readonly onPress: () => void;
}

export const DeletableRowAction = ({ drag, isOpen, onPress }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    const containerStyle = isOpen ? null : styleAnimation;

    return (
        <Reanimated.View style={containerStyle}>
            <HapticPressable
                testID={DeletableRowSelector.DeleteButton}
                onPress={onPress}
                className="justify-center items-center w-17.5 h-full"
            >
                <Icon className="text-destructive-foreground" icon={UserIconNameEnum.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
