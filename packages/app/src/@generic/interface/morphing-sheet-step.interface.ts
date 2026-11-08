import type { MorphingSheetPresentationEnum } from '../enum/morphing-sheet-presentation.enum';
import type { ReactNode } from 'react';

export interface MorphingSheetStepInterface {
    readonly content: ReactNode;
    readonly presentation: MorphingSheetPresentationEnum;
}
