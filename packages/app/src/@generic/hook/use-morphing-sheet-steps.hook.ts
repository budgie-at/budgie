import { useState } from 'react';

import { MorphingSheetPresentationEnum } from '../enum/morphing-sheet-presentation.enum';

import type { MorphingSheetStepInterface } from '../interface/morphing-sheet-step.interface';

export const useMorphingSheetSteps = (steps: Readonly<Record<string, MorphingSheetStepInterface>>, activeStep: string) => {
    const isPage = steps[activeStep]?.presentation === MorphingSheetPresentationEnum.PAGE;
    const [lastCardStep, setLastCardStep] = useState(activeStep);
    const [visitedSteps, setVisitedSteps] = useState([activeStep]);
    const [hasPresented, setHasPresented] = useState(false);
    const cardStep = isPage ? lastCardStep : activeStep;

    if (!isPage && lastCardStep !== activeStep) {
        setLastCardStep(activeStep);
    }

    if (!visitedSteps.includes(cardStep)) {
        setVisitedSteps([...visitedSteps, cardStep]);
    }

    const cardSteps = Object.entries(steps)
        .filter(([, step]) => step.presentation === MorphingSheetPresentationEnum.CARD)
        .map(([key]) => key);

    const handlePresented = () => {
        setHasPresented(true);
    };

    return {
        cardStep,
        pageStep: isPage ? activeStep : null,
        mountedSteps: hasPresented ? cardSteps : visitedSteps,
        hasPresented,
        handlePresented
    };
};
