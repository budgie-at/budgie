import { useState } from 'react';

import type { ReactNode } from 'react';

export const useMorphingSheetMountedSteps = (steps: Readonly<Record<string, ReactNode>>, activeStep: string) => {
    const [visitedSteps, setVisitedSteps] = useState([activeStep]);
    const [hasPresented, setHasPresented] = useState(false);

    if (!visitedSteps.includes(activeStep)) {
        setVisitedSteps([...visitedSteps, activeStep]);
    }

    const mountedSteps = hasPresented ? Object.keys(steps) : visitedSteps;

    const handlePresented = () => {
        setHasPresented(true);
    };

    return { mountedSteps, handlePresented };
};
