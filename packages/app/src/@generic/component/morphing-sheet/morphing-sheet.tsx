import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheetDragContext } from '../../context/morphing-sheet-drag.context';
import { MorphingSheetDismissContext } from '../../context/morphing-sheet.context';
import { SurfaceSettledContext } from '../../context/surface-settled.context';
import { useAccessibilityLayer } from '../../hook/use-accessibility-layer.hook';
import { useMorphingSheetBack } from '../../hook/use-morphing-sheet-back.hook';
import { useMorphingSheetKeyboardLift } from '../../hook/use-morphing-sheet-keyboard-lift.hook';
import { useMorphingSheetMotion } from '../../hook/use-morphing-sheet-motion.hook';
import { useMorphingSheetPageRect } from '../../hook/use-morphing-sheet-page-rect.hook';
import { useMorphingSheetPage } from '../../hook/use-morphing-sheet-page.hook';
import { useMorphingSheetSteps } from '../../hook/use-morphing-sheet-steps.hook';
import { useMorphingSheetStyle } from '../../hook/use-morphing-sheet-style.hook';
import { MorphScrim } from '../morph-scrim/morph-scrim';
import { MorphingSheetCard } from '../morphing-sheet-card/morphing-sheet-card';
import { MorphingSheetPageBackdrop } from '../morphing-sheet-page-backdrop/morphing-sheet-page-backdrop';
import { MorphingSheetPageLayer } from '../morphing-sheet-page-layer/morphing-sheet-page-layer';
import { MorphingSheetStep } from '../morphing-sheet-step/morphing-sheet-step';

import type { MorphingSheetStepInterface } from '../../interface/morphing-sheet-step.interface';

interface Props {
    readonly steps: Readonly<Record<string, MorphingSheetStepInterface>>;
    readonly activeStep: string;
    readonly onDismiss: () => void;
    readonly testID?: string;
}

export const MorphingSheet = ({ steps, activeStep, onDismiss, testID }: Props) => {
    const { cardStep, pageStep, mountedSteps, hasPresented, handlePresented } = useMorphingSheetSteps(steps, activeStep);
    const motion = useMorphingSheetMotion(cardStep, onDismiss, handlePresented);
    const { translateY, visibleHeight, pageProgress, isDragging } = motion;
    const keyboardLift = useMorphingSheetKeyboardLift(motion.frame.baseBottom);
    const { frameStyle, cardStyle, presence } = useMorphingSheetStyle(motion, keyboardLift);
    const page = useMorphingSheetPage(pageStep, pageProgress, keyboardLift);
    const pageRect = useMorphingSheetPageRect(pageProgress, visibleHeight, page.frozenLift, translateY);
    const isCovered = useAccessibilityLayer();
    const back = useMorphingSheetBack(steps[activeStep]?.onBack, motion);
    const isPageActive = isDefined(pageStep);
    const drag = {
        translateY,
        visibleHeight,
        isDragging,
        isDismissing: motion.isDismissing,
        isEnabled: !isPageActive,
        onSwipeDismiss: back.handleSwipeBack
    };
    const pageContent = isDefined(page.renderedPageStep) ? steps[page.renderedPageStep]?.content : null;

    return (
        <MorphingSheetDismissContext value={motion.handleDismiss}>
            <MorphingSheetDragContext value={drag}>
                <View
                    className="absolute inset-0"
                    pointerEvents="box-none"
                    collapsable={false}
                    accessibilityElementsHidden={isCovered}
                    accessibilityViewIsModal
                    onAccessibilityEscape={back.handleBack}
                >
                    <MorphScrim presence={presence} label={back.label} onPress={back.handleBack} />

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
