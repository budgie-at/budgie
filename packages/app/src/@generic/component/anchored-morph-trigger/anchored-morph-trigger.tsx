import { useState } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { emptyFn, isNumber, isString } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../enum/rounded-edge.enum';

import type { AnchoredMorphOriginInterface } from '../../interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly edge: RoundedEdgeEnum;
    readonly onPress: (origin: AnchoredMorphOriginInterface) => void;
    readonly children: (onPress: () => void) => ReactNode;
    readonly radiusClassName?: string;
    readonly colorClassName?: string;
}

export const AnchoredMorphTrigger = (props: Props) => {
    const { edge, onPress, children, radiusClassName = 'rounded-3xl', colorClassName = 'bg-surface-row' } = props;
    const [view, setView] = useState<View | null>(null);
    const { borderRadius } = useResolveClassNames(radiusClassName);
    const { backgroundColor } = useResolveClassNames(colorClassName);

    const radius = isNumber(borderRadius) ? borderRadius : 0;
    const topRadius = edge === RoundedEdgeEnum.TOP || edge === RoundedEdgeEnum.ALL ? radius : 0;
    const bottomRadius = edge === RoundedEdgeEnum.BOTTOM || edge === RoundedEdgeEnum.ALL ? radius : 0;
    const color = isString(backgroundColor) ? backgroundColor : 'transparent';

    const handlePress = () => {
        view?.measureInWindow((x, y, width, height) => {
            onPress({
                rect: { x, y, width, height },
                color,
                content: children(emptyFn),
                radii: { topLeft: topRadius, topRight: topRadius, bottomLeft: bottomRadius, bottomRight: bottomRadius }
            });
        });
    };

    return (
        <View ref={setView} collapsable={false}>
            {children(handlePress)}
        </View>
    );
};
