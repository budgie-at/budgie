import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useMorphingSheetPageRectStyle } from '../../hook/use-morphing-sheet-page-rect-style.hook';

import type { MorphingSheetPageRectInterface } from '../../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly rect: SharedValue<MorphingSheetPageRectInterface>;
    readonly pageProgress: SharedValue<number>;
}

export const MorphingSheetPageBackdrop = ({ rect, pageProgress }: Props) => {
    const rectStyle = useMorphingSheetPageRectStyle(rect);
    const pageSurfaceStyle = useAnimatedStyle(() => ({ opacity: pageProgress.get() }));

    return (
        <Animated.View className="absolute overflow-hidden" style={rectStyle} pointerEvents="none">
            <View className="bg-sheet-surface absolute inset-0" />
            <Animated.View className="bg-surface absolute inset-0" style={pageSurfaceStyle} />
        </Animated.View>
    );
};
