import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AnchoredMorphPanel } from '../anchored-morph-panel/anchored-morph-panel';
import { SingleStepMorphingSheet } from '../single-step-morphing-sheet/single-step-morphing-sheet';

import type { AnchoredMorphOriginInterface } from '../../interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
    readonly origin: AnchoredMorphOriginInterface | undefined;
    readonly onDismissed: () => void;
    readonly sheetStyle?: StyleProp<ViewStyle>;
    readonly children: ReactNode;
}

export const SelectorMorphingSurface = ({ origin, onDismissed, sheetStyle, children }: Props) =>
    isDefined(origin) ? (
        <AnchoredMorphPanel origin={origin} onDismissed={onDismissed}>
            {children}
        </AnchoredMorphPanel>
    ) : (
        <SingleStepMorphingSheet onDismiss={onDismissed} isContentDraggable={false}>
            <View style={sheetStyle}>{children}</View>
        </SingleStepMorphingSheet>
    );
