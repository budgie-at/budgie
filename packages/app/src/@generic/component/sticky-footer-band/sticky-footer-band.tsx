import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EdgeFade } from '../edge-fade/edge-fade';

import type { ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;

export const StickyFooterBand = ({ children }: Props): ReactNode => (
    <KeyboardStickyView style={STICKY_FOOTER_STYLE}>
        <EdgeFade position="bottom" />
        <View className="z-3 pb-safe">{children}</View>
    </KeyboardStickyView>
);
