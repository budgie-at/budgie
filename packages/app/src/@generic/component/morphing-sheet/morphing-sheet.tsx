import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { useMorphingSheetGesture } from '../../hook/use-morphing-sheet-gesture.hook';
import { useMorphingSheetMotion } from '../../hook/use-morphing-sheet-motion.hook';
import { useMorphingSheetMountedSteps } from '../../hook/use-morphing-sheet-mounted-steps.hook';
import { useMorphingSheetStyle } from '../../hook/use-morphing-sheet-style.hook';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { MorphingSheetScrim } from '../morphing-sheet-scrim/morphing-sheet-scrim';
import { MorphingSheetStep } from '../morphing-sheet-step/morphing-sheet-step';

import type { ReactNode } from 'react';

interface Props {
    readonly steps: Readonly<Record<string, ReactNode>>;
    readonly activeStep: string;
    readonly onDismiss: () => void;
    readonly isContentDraggable?: boolean;
    readonly testID?: string;
}

export const MorphingSheet = ({ steps, activeStep, onDismiss, isContentDraggable = true, testID }: Props) => {
    const isReducedMotion = useReducedMotion();

    const { mountedSteps, handlePresented } = useMorphingSheetMountedSteps(steps, activeStep);

    const { baseBottom, frameHeight, translateY, visibleHeight, morph, handleDismiss, handleSwipeDismiss, handleStepLayout } =
        useMorphingSheetMotion(activeStep, onDismiss, handlePresented);

    const { frameStyle, cardStyle } = useMorphingSheetStyle(translateY, visibleHeight, baseBottom, frameHeight);

    const isDragEnabled = !isReducedMotion;
    const bodyGesture = useMorphingSheetGesture({
        translateY,
        visibleHeight,
        isEnabled: isDragEnabled && isContentDraggable,
        onDismiss: handleSwipeDismiss
    });

    return (
        <MorphingSheetDismissContext value={handleDismiss}>
            <View className="absolute inset-0" pointerEvents="box-none" collapsable={false}>
                <MorphingSheetScrim
                    translateY={translateY}
                    visibleHeight={visibleHeight}
                    hiddenInset={baseBottom}
                    onPress={handleDismiss}
                />

                <Animated.View className="absolute right-[16px] left-[16px] overflow-hidden" style={frameStyle} pointerEvents="box-none">
                    <GestureDetector gesture={bodyGesture}>
                        <Animated.View className="bg-sheet-surface absolute inset-x-0 top-0 overflow-hidden" style={cardStyle} testID={testID}>
                            {mountedSteps.map(step => (
                                <MorphingSheetStep
                                    key={step}
                                    step={step}
                                    isActive={step === activeStep}
                                    morph={morph}
                                    onStepLayout={handleStepLayout}
                                >
                                    {steps[step]}
                                </MorphingSheetStep>
                            ))}
                        </Animated.View>
                    </GestureDetector>
                </Animated.View>
            </View>
        </MorphingSheetDismissContext>
    );
};
