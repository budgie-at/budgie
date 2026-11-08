import { useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { SurfaceSettledContext } from '../../context/surface-settled.context';
import { useMorphingSheetPageRectStyle } from '../../hook/use-morphing-sheet-page-rect-style.hook';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';

import type { MorphingSheetPageRectInterface } from '../../interface/morphing-sheet-page-rect.interface';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly rect: SharedValue<MorphingSheetPageRectInterface>;
    readonly pageProgress: SharedValue<number>;
    readonly isActive: boolean;
    readonly isSettled: boolean;
    readonly onLayout: () => void;
    readonly children: ReactNode;
}

const PAGE_PARALLAX = 16;

export const MorphingSheetPageLayer = ({ rect, pageProgress, isActive, isSettled, onLayout, children }: Props) => {
    const { width, height } = useWindowDimensions();
    const isReducedMotion = useReducedMotion();
    const clipStyle = useMorphingSheetPageRectStyle(rect);

    const contentStyle = useAnimatedStyle(() => {
        const { left, top } = rect.get();
        const progress = pageProgress.get();

        return {
            width,
            height,
            opacity: isReducedMotion ? 1 : progress,
            transform: [{ translateX: -left }, { translateY: -top + (isReducedMotion ? 0 : PAGE_PARALLAX * (1 - progress)) }]
        };
    });

    const pointerEvents = isActive ? 'auto' : 'none';
    const isHiddenFromAccessibility = !isActive;
    const importantForAccessibility = isActive ? 'auto' : 'no-hide-descendants';

    return (
        <Animated.View
            className="absolute overflow-hidden"
            style={clipStyle}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={isHiddenFromAccessibility}
            importantForAccessibility={importantForAccessibility}
        >
            <Animated.View className="absolute top-0 left-0" style={contentStyle} onLayout={onLayout}>
                <SurfaceSettledContext value={isSettled}>{children}</SurfaceSettledContext>
            </Animated.View>
        </Animated.View>
    );
};
