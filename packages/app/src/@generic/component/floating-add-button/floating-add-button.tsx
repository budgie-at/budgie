import { ReactNode, RefObject, useRef } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IdInterface } from '../../interface/id.interface';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

export interface FloatingAddButtonProps<T extends IdInterface> {
    renderBottomSheet: (item: T | null, ref: RefObject<BottomSheetInterface | null>) => ReactNode;
}

export const FloatingAddButton = <T extends IdInterface>({ renderBottomSheet }: FloatingAddButtonProps<T>) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <View className="absolute bottom-1/10 right-10">
                <Animated.View entering={ZoomIn.duration(300).delay(350)}>
                    <HapticPressable
                        onPress={handleOpen}
                        className="bg-primary rounded-full w-16 h-16 items-center justify-center active:scale-[0.95]"
                    >
                        <Icon icon="Plus" className="text-primary-reverse" size={32} />
                    </HapticPressable>
                </Animated.View>
            </View>

            {renderBottomSheet(null, ref)}
        </>
    );
};
