import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import type { LayoutChangeEvent, ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly onLayout?: (event: LayoutChangeEvent) => void;
    readonly fadeHeight?: number;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;

export const StickyFooterBand = ({ children, onLayout, fadeHeight }: Props): ReactNode => (
    <KeyboardStickyView style={STICKY_FOOTER_STYLE}>
        <EdgeFade position="bottom" {...(isDefined(fadeHeight) && { height: fadeHeight })} />
        <View className="z-3 pb-safe" onLayout={onLayout}>
            {children}
        </View>
    </KeyboardStickyView>
);
