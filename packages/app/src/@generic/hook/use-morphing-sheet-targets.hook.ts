import { useState } from 'react';

import { MorphingSheetPresentationEnum } from '../enum/morphing-sheet-presentation.enum';

import type { MorphingSheetStepInterface } from '../interface/morphing-sheet-step.interface';

export const useMorphingSheetTargets = (steps: Readonly<Record<string, MorphingSheetStepInterface>>, activeStep: string) => {
    const [lastCardStep, setLastCardStep] = useState(activeStep);
    const isPage = steps[activeStep]?.presentation === MorphingSheetPresentationEnum.PAGE;

    if (!isPage && lastCardStep !== activeStep) {
        setLastCardStep(activeStep);
    }

    return { cardStep: isPage ? lastCardStep : activeStep, pageStep: isPage ? activeStep : null };
};
