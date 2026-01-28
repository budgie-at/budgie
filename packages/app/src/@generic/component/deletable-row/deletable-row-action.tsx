import { UserIconNameEnum } from '@budgie/contracts';
import React from 'react';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly drag: SharedValue<number>;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const DeletableRowAction = ({ drag, onPress, testID }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    return (
        <Reanimated.View style={styleAnimation}>
            <HapticPressable testID={testID} onPress={onPress} className="justify-center items-center w-17.5 h-full">
                <Icon className="text-primary" icon={UserIconNameEnum.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
