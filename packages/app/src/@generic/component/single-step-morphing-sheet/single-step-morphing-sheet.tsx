import { MorphingSheetPresentationEnum } from '../../enum/morphing-sheet-presentation.enum';
import { MorphingSheet } from '../morphing-sheet/morphing-sheet';

import type { ReactNode } from 'react';

const MAIN_STEP = 'MAIN';

interface Props {
    readonly onDismiss: () => void;
    readonly isContentDraggable?: boolean;
    readonly children: ReactNode;
}

export const SingleStepMorphingSheet = ({ onDismiss, isContentDraggable = true, children }: Props) => {
    const steps = { [MAIN_STEP]: { presentation: MorphingSheetPresentationEnum.CARD, content: children } };

    return <MorphingSheet steps={steps} activeStep={MAIN_STEP} onDismiss={onDismiss} isContentDraggable={isContentDraggable} />;
};
