import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheetDragContext } from '../../context/morphing-sheet-drag.context';
import { MorphingSheetDragDetector } from '../morphing-sheet-drag-detector/morphing-sheet-drag-detector';

import type { ReactElement } from 'react';

interface Props {
    readonly children: ReactElement;
}

export const MorphingSheetDragZone = ({ children }: Props) => {
    const drag = use(MorphingSheetDragContext);

    return isDefined(drag) ? <MorphingSheetDragDetector drag={drag}>{children}</MorphingSheetDragDetector> : children;
};
