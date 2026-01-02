import { ReactNode, RefObject, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly renderBottomSheet: (ref: RefObject<BottomSheetInterface | null>) => ReactNode;
    readonly onPress?: () => void;
}

export const FloatingActionButton = ({ renderBottomSheet, onPress }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { bottom } = useSafeAreaInsets();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            ref.current?.open();
        }
    };

    const style: ViewStyle = { bottom: bottom + 24, right: 24 };

    return (
        <>
            <View className="absolute" style={style}>
                <Animated.View entering={ZoomIn.duration(300).delay(350)}>
                    <HapticPressable onPress={handlePress} className="shadow-lg rounded-full">
                        <CircleIcon icon="Plus" variant="primary" size={56} iconSize={28} radius={28} border={false} />
                    </HapticPressable>
                </Animated.View>
            </View>

            {renderBottomSheet(ref)}
        </>
    );
};
