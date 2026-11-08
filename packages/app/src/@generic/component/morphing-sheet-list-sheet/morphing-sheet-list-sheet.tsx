import { View } from 'react-native';

import { MorphingSheetPresentationEnum } from '../../enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../hook/use-morphing-sheet-list-height.hook';
import { MorphingSheet } from '../morphing-sheet/morphing-sheet';

import type { ReactNode } from 'react';

interface Props {
    readonly heightRatio: number;
    readonly onDismiss: () => void;
    readonly children: ReactNode;
}

const LIST_STEP = 'LIST';

export const MorphingSheetListSheet = ({ heightRatio, onDismiss, children }: Props) => {
    const listStyle = useMorphingSheetListHeight(heightRatio);

    const steps = {
        [LIST_STEP]: { presentation: MorphingSheetPresentationEnum.CARD, content: <View style={listStyle}>{children}</View> }
    };

    return <MorphingSheet steps={steps} activeStep={LIST_STEP} onDismiss={onDismiss} isContentDraggable={false} />;
};
