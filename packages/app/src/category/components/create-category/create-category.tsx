import { useRef } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategoryFormBottomSheet } from '../category-form-bottom-sheet/category-form-bottom-sheet';

export const CreateCategory = () => {
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
                        <Icon icon={ICONS.Plus} className="text-primary-reverse" size={32} />
                    </HapticPressable>
                </Animated.View>
            </View>

            <CategoryFormBottomSheet ref={ref} category={null} />
        </>
    );
};
