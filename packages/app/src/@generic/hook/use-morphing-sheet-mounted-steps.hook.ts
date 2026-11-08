import { useState } from 'react';

import { MorphingSheetPresentationEnum } from '../enum/morphing-sheet-presentation.enum';

import type { MorphingSheetStepInterface } from '../interface/morphing-sheet-step.interface';

export const useMorphingSheetMountedSteps = (steps: Readonly<Record<string, MorphingSheetStepInterface>>, cardStep: string) => {
    const [visitedSteps, setVisitedSteps] = useState([cardStep]);
    const [hasPresented, setHasPresented] = useState(false);

    if (!visitedSteps.includes(cardStep)) {
        setVisitedSteps([...visitedSteps, cardStep]);
    }

    const cardSteps = Object.entries(steps)
        .filter(([, step]) => step.presentation === MorphingSheetPresentationEnum.CARD)
        .map(([key]) => key);
    const mountedSteps = hasPresented ? cardSteps : visitedSteps;

    const handlePresented = () => {
        setHasPresented(true);
    };

    return { mountedSteps, handlePresented };
};
