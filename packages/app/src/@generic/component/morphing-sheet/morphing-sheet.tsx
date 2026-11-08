import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheetDragContext } from '../../context/morphing-sheet-drag.context';
import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { SurfaceSettledContext } from '../../context/surface-settled.context';
import { useMorphingSheetMotion } from '../../hook/use-morphing-sheet-motion.hook';
import { useMorphingSheetMountedSteps } from '../../hook/use-morphing-sheet-mounted-steps.hook';
import { useMorphingSheetPageRect } from '../../hook/use-morphing-sheet-page-rect.hook';
import { useMorphingSheetPage } from '../../hook/use-morphing-sheet-page.hook';
import { useMorphingSheetStyle } from '../../hook/use-morphing-sheet-style.hook';
import { useMorphingSheetTargets } from '../../hook/use-morphing-sheet-targets.hook';
import { MorphingSheetCard } from '../morphing-sheet-card/morphing-sheet-card';
import { MorphingSheetPageBackdrop } from '../morphing-sheet-page-backdrop/morphing-sheet-page-backdrop';
import { MorphingSheetPageLayer } from '../morphing-sheet-page-layer/morphing-sheet-page-layer';
import { MorphingSheetScrim } from '../morphing-sheet-scrim/morphing-sheet-scrim';
import { MorphingSheetStep } from '../morphing-sheet-step/morphing-sheet-step';

import type { MorphingSheetStepInterface } from '../../interface/morphing-sheet-step.interface';

interface Props {
    readonly steps: Readonly<Record<string, MorphingSheetStepInterface>>;
    readonly activeStep: string;
    readonly onDismiss: () => void;
    readonly testID?: string;
}

export const MorphingSheet = ({ steps, activeStep, onDismiss, testID }: Props) => {
    const { cardStep, pageStep } = useMorphingSheetTargets(steps, activeStep);
    const { mountedSteps, hasPresented, handlePresented } = useMorphingSheetMountedSteps(steps, cardStep);
    const motion = useMorphingSheetMotion(cardStep, onDismiss, handlePresented);
    const { frame, translateY, visibleHeight, pageProgress } = motion;
    const { frameStyle, cardStyle, isDragging } = useMorphingSheetStyle(translateY, visibleHeight, pageProgress, frame);
    const page = useMorphingSheetPage(pageStep, pageProgress, frame.baseBottom);
    const pageRect = useMorphingSheetPageRect(pageProgress, visibleHeight, page.frozenLift, translateY);
    const stepBack = steps[activeStep]?.onBack;
    const handleBack = stepBack ?? motion.handleDismiss;

    const handleSwipeBack = (velocity: number) => {
        if (isDefined(stepBack)) {
            motion.handleSettle(velocity);
            stepBack();
        } else {
            motion.handleSwipeDismiss(velocity);
        }
    };

    const isPageActive = isDefined(pageStep);
    const drag = {
        translateY,
        visibleHeight,
        isDragging,
        isDismissing: motion.isDismissing,
        isEnabled: !isPageActive,
        onSwipeDismiss: handleSwipeBack
    };
    const pageContent = isDefined(page.renderedPageStep) ? steps[page.renderedPageStep]?.content : null;

    return (
        <MorphingSheetDismissContext value={motion.handleDismiss}>
            <MorphingSheetDragContext value={drag}>
                <View
                    className="absolute inset-0"
                    pointerEvents="box-none"
                    collapsable={false}
                    accessibilityViewIsModal
                    onAccessibilityEscape={handleBack}
                >
                    <MorphingSheetScrim
                        translateY={translateY}
                        visibleHeight={visibleHeight}
                        hiddenInset={frame.baseBottom}
                        onPress={handleBack}
                    />

                    {isDefined(page.renderedPageStep) ? <MorphingSheetPageBackdrop rect={pageRect} /> : null}

                    <MorphingSheetCard frameStyle={frameStyle} cardStyle={cardStyle} isPageActive={isPageActive} testID={testID}>
                        <SurfaceSettledContext value={hasPresented}>
                            {mountedSteps.map(step => (
                                <MorphingSheetStep
                                    key={step}
                                    step={step}
                                    isActive={step === cardStep}
                                    morph={motion.morph}
                                    onStepLayout={motion.handleStepLayout}
                                >
                                    {steps[step]?.content}
                                </MorphingSheetStep>
                            ))}
                        </SurfaceSettledContext>
                    </MorphingSheetCard>

                    {isDefined(page.renderedPageStep) ? (
                        <MorphingSheetPageLayer
                            rect={pageRect}
                            pageProgress={pageProgress}
                            isActive={isPageActive}
                            isSettled={page.isPageSettled}
                            onLayout={page.handlePageLayout}
                        >
                            {pageContent}
                        </MorphingSheetPageLayer>
                    ) : null}
                </View>
            </MorphingSheetDragContext>
        </MorphingSheetDismissContext>
    );
};
