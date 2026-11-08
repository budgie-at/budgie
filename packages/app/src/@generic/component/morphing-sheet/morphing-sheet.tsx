import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { useMorphingSheetGesture } from '../../hook/use-morphing-sheet-gesture.hook';
import { useMorphingSheetMotion } from '../../hook/use-morphing-sheet-motion.hook';
import { useMorphingSheetMountedSteps } from '../../hook/use-morphing-sheet-mounted-steps.hook';
import { useMorphingSheetPageRect } from '../../hook/use-morphing-sheet-page-rect.hook';
import { useMorphingSheetPage } from '../../hook/use-morphing-sheet-page.hook';
import { useMorphingSheetStyle } from '../../hook/use-morphing-sheet-style.hook';
import { useMorphingSheetTargets } from '../../hook/use-morphing-sheet-targets.hook';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { MorphingSheetPageBackdrop } from '../morphing-sheet-page-backdrop/morphing-sheet-page-backdrop';
import { MorphingSheetPageLayer } from '../morphing-sheet-page-layer/morphing-sheet-page-layer';
import { MorphingSheetScrim } from '../morphing-sheet-scrim/morphing-sheet-scrim';
import { MorphingSheetStep } from '../morphing-sheet-step/morphing-sheet-step';

import type { MorphingSheetStepInterface } from '../../interface/morphing-sheet-step.interface';

interface Props {
    readonly steps: Readonly<Record<string, MorphingSheetStepInterface>>;
    readonly activeStep: string;
    readonly onDismiss: () => void;
    readonly isContentDraggable?: boolean;
    readonly testID?: string;
}

export const MorphingSheet = ({ steps, activeStep, onDismiss, isContentDraggable = true, testID }: Props) => {
    const isReducedMotion = useReducedMotion();
    const { cardStep, pageStep } = useMorphingSheetTargets(steps, activeStep);
    const { mountedSteps, handlePresented } = useMorphingSheetMountedSteps(steps, cardStep);

    const { frame, translateY, visibleHeight, pageProgress, morph, handleDismiss, handleSwipeDismiss, handleStepLayout } =
        useMorphingSheetMotion(cardStep, onDismiss, handlePresented);

    const { frameStyle, cardStyle } = useMorphingSheetStyle(translateY, visibleHeight, pageProgress, frame);
    const { renderedPageStep, isPageSettled, frozenLift, handlePageLayout } = useMorphingSheetPage(
        pageStep,
        pageProgress,
        frame.baseBottom
    );
    const pageRect = useMorphingSheetPageRect(pageProgress, visibleHeight, frozenLift, frame.baseBottom);

    const isPageActive = isDefined(pageStep);
    const framePointerEvents = isPageActive ? 'none' : 'box-none';
    const bodyGesture = useMorphingSheetGesture({
        translateY,
        visibleHeight,
        isEnabled: !isReducedMotion && isContentDraggable && !isPageActive,
        onDismiss: handleSwipeDismiss
    });

    const hasPage = isDefined(renderedPageStep);
    const pageContent = hasPage ? steps[renderedPageStep]?.content : null;

    return (
        <MorphingSheetDismissContext value={handleDismiss}>
            <View className="absolute inset-0" pointerEvents="box-none" collapsable={false}>
                <MorphingSheetScrim
                    translateY={translateY}
                    visibleHeight={visibleHeight}
                    hiddenInset={frame.baseBottom}
                    onPress={handleDismiss}
                />

                {hasPage ? <MorphingSheetPageBackdrop rect={pageRect} /> : null}

                <Animated.View
                    className="absolute right-[16px] left-[16px] overflow-hidden"
                    style={frameStyle}
                    pointerEvents={framePointerEvents}
                >
                    <GestureDetector gesture={bodyGesture}>
                        <Animated.View className="bg-sheet-surface absolute inset-x-0 top-0" style={cardStyle} testID={testID}>
                            {mountedSteps.map(step => (
                                <MorphingSheetStep
                                    key={step}
                                    step={step}
                                    isActive={step === cardStep}
                                    morph={morph}
                                    onStepLayout={handleStepLayout}
                                >
                                    {steps[step]?.content}
                                </MorphingSheetStep>
                            ))}
                        </Animated.View>
                    </GestureDetector>
                </Animated.View>

                {hasPage ? (
                    <MorphingSheetPageLayer
                        rect={pageRect}
                        pageProgress={pageProgress}
                        isActive={isPageActive}
                        isSettled={isPageSettled}
                        onLayout={handlePageLayout}
                    >
                        {pageContent}
                    </MorphingSheetPageLayer>
                ) : null}
            </View>
        </MorphingSheetDismissContext>
    );
};
