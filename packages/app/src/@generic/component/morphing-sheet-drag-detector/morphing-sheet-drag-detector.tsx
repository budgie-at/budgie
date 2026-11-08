import { GestureDetector } from 'react-native-gesture-handler';

import { useMorphingSheetGesture } from '../../hook/use-morphing-sheet-gesture.hook';

import type { MorphingSheetDragInterface } from '../../interface/morphing-sheet-drag.interface';
import type { ReactElement } from 'react';

interface Props {
    readonly drag: MorphingSheetDragInterface;
    readonly children: ReactElement;
}

export const MorphingSheetDragDetector = ({ drag, children }: Props) => {
    const gesture = useMorphingSheetGesture(drag);

    return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
};
