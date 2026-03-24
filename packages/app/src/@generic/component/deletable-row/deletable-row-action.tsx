import { UserIconNameEnum } from '@budgie/contracts';
import React from 'react';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { DeletableRowSelectors } from '../../../@e2e/selectors/deletable-row.selector';
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
            <HapticPressable
                testID={DeletableRowSelectors.DeleteButton}
                onPress={onPress}
                className="justify-center items-center w-17.5 h-full"
            >
                <Icon className="text-primary" icon={UserIconNameEnum.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
