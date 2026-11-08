import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetKeyboardLift } from './use-morphing-sheet-keyboard-lift.hook';
import { useMorphingSheetPageMotion } from './use-morphing-sheet-page-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

export const useMorphingSheetPage = (pageStep: string | null, pageProgress: SharedValue<number>, baseBottom: number) => {
    const keyboardLift = useMorphingSheetKeyboardLift(baseBottom);
    const frozenLift = useSharedValue(0);
    const [renderedPageStep, setRenderedPageStep] = useState<string | null>(null);
    const [isPageSettled, setIsPageSettled] = useState(false);
    const isLaidOut = useRef(false);

    if (isDefined(pageStep) && renderedPageStep !== pageStep) {
        setRenderedPageStep(pageStep);
    }

    const handleCollapsed = () => {
        isLaidOut.current = false;
        setIsPageSettled(false);
        setRenderedPageStep(null);
    };

    const { expand, collapse } = useMorphingSheetPageMotion(pageProgress, setIsPageSettled, handleCollapsed);

    const handlePageStepChange = useEffectEvent(() => {
        if (isDefined(pageStep)) {
            frozenLift.set(keyboardLift.get());

            if (isLaidOut.current) {
                expand();
            }
        } else if (isDefined(renderedPageStep)) {
            Keyboard.dismiss();
            frozenLift.set(0);
            collapse();
        }
    });

    useEffect(() => {
        handlePageStepChange();
    }, [pageStep]);

    const handlePageLayout = () => {
        if (isLaidOut.current) {
            return;
        }

        isLaidOut.current = true;

        if (isDefined(pageStep)) {
            expand();
        }
    };

    return { renderedPageStep, isPageSettled, frozenLift, handlePageLayout };
};
