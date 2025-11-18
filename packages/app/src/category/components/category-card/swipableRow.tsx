import React, { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { styled } from 'nativewind';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    children: ReactNode;
    onDelete: () => void;
}

function RightAction({ drag, onPress }: { drag: SharedValue<number>; onPress: () => void }) {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    return (
        <Reanimated.View style={styleAnimation}>
            <Pressable onPress={onPress} className="justify-center items-center w-[70px] h-full">
                <Icon className="text-primary" icon={ICONS.Trash} />
            </Pressable>
        </Reanimated.View>
    );
}

const Swipable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

export const SwipableRow = ({ children, onDelete }: Props) => {
    return (
        <GestureHandlerRootView>
            <Swipable friction={2} enableTrackpadTwoFingerGesture rightThreshold={40} renderRightActions={(_, drag) => <RightAction drag={drag} onPress={onDelete} />}>
                {children}
            </Swipable>
        </GestureHandlerRootView>
    );
};
