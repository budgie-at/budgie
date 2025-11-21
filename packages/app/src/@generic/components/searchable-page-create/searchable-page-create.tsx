import { ComponentProps, useRef } from 'react';
import { View } from 'react-native';
import Animated, { Keyframe, useAnimatedStyle, useSharedValue, ZoomOut } from 'react-native-reanimated';

import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IdInterface } from '../../interface/id.interface';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

const RotationEntering = new Keyframe({
    0: {
        transform: [{ scale: 0 }, { rotate: '45deg' }],
        opacity: 0
    },
    70: {
        transform: [{ scale: 1.08 }, { rotate: '-5deg' }],
        opacity: 1
    },
    100: {
        transform: [{ scale: 1 }, { rotate: '0deg' }],
        opacity: 1
    }
})
    .duration(450)
    .delay(300);

export const SearchablePageCreate = <T extends IdInterface>({
    renderBottomSheet
}: Pick<ComponentProps<typeof SearchablePageList<T>>, 'renderBottomSheet'>) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <View className="absolute bottom-1/10 right-10">
                <Animated.View entering={RotationEntering} exiting={ZoomOut.duration(150)} style={animatedStyle}>
                    <HapticPressable
                        onPress={handleOpen}
                        className="bg-primary rounded-full w-16 h-16 items-center justify-center shadow-lg"
                    >
                        <Icon icon={ICONS.Plus} className="text-primary-reverse" size={32} />
                    </HapticPressable>
                </Animated.View>
            </View>

            {renderBottomSheet(null, ref)}
        </>
    );
};
