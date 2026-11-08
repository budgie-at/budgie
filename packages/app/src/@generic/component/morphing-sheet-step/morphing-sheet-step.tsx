import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { MorphingSheetMorphInterface } from '../../interface/morphing-sheet-morph.interface';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly step: string;
    readonly isActive: boolean;
    readonly morph: MorphingSheetMorphInterface;
    readonly onStepLayout: (step: string, event: LayoutChangeEvent) => void;
    readonly children: ReactNode;
}

const STEP_FADE_TIMING = { duration: 130, easing: Easing.inOut(Easing.quad) };
const TALLER_STEP_MIN_SCALE = 0.9;

export const MorphingSheetStep = ({ step, isActive, morph, onStepLayout, children }: Props) => {
    const opacity = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
        opacity.set(withTiming(isActive ? 1 : 0, STEP_FADE_TIMING));
    }, [isActive, opacity]);

    const stepStyle = useAnimatedStyle(() => {
        if (!morph.isProgressDriven.get()) {
            return { opacity: opacity.get(), transform: [{ scale: 1 }] };
        }

        if (step !== morph.fromStep.get() && step !== morph.toStep.get()) {
            return { opacity: 0, transform: [{ scale: 1 }] };
        }

        const progress = morph.progress.get();

        if (step === morph.tallerStep.get()) {
            return { opacity: progress, transform: [{ scale: TALLER_STEP_MIN_SCALE + (1 - TALLER_STEP_MIN_SCALE) * progress }] };
        }

        return { opacity: 1 - progress * progress * (3 - 2 * progress), transform: [{ scale: 1 }] };
    });

    const handleLayout = (event: LayoutChangeEvent) => {
        onStepLayout(step, event);
    };

    const pointerEvents = isActive ? 'auto' : 'none';
    const accessibilityImportance = isActive ? 'auto' : 'no-hide-descendants';

    return (
        <Animated.View
            className="absolute inset-x-0 top-0"
            style={stepStyle}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={!isActive}
            importantForAccessibility={accessibilityImportance}
            onLayout={handleLayout}
        >
            {children}
        </Animated.View>
    );
};
