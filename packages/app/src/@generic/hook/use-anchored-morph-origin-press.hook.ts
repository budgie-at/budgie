import { useResolveClassNames } from 'uniwind';

import { isNumber, isString } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../enum/rounded-edge.enum';

import { useMeasureInWindowPress } from './use-measure-in-window-press.hook';

import type { AnchoredMorphOriginInterface } from '../interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';

export const useAnchoredMorphOriginPress = (
    edge: RoundedEdgeEnum,
    content: ReactNode,
    onPress: (origin: AnchoredMorphOriginInterface) => void
) => {
    const { borderRadius: resolvedRadius } = useResolveClassNames('rounded-3xl');
    const { backgroundColor } = useResolveClassNames('bg-surface-row');

    const borderRadius = isNumber(resolvedRadius) ? resolvedRadius : 0;
    const isTopRounded = edge === RoundedEdgeEnum.TOP || edge === RoundedEdgeEnum.ALL;
    const isBottomRounded = edge === RoundedEdgeEnum.BOTTOM || edge === RoundedEdgeEnum.ALL;
    const topRadius = isTopRounded ? borderRadius : 0;
    const bottomRadius = isBottomRounded ? borderRadius : 0;
    const color = isString(backgroundColor) ? backgroundColor : 'transparent';

    const { ref, handlePress } = useMeasureInWindowPress(rect => {
        onPress({
            rect,
            color,
            content,
            radii: { topLeft: topRadius, topRight: topRadius, bottomLeft: bottomRadius, bottomRight: bottomRadius }
        });
    });

    return { ref, handlePress };
};
