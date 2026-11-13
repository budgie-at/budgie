import { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import type { ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;
const FOOTER_STYLE = { position: 'relative' } as const;
const KEYBOARD_GAP = 12;

export const StickyFooterBand = ({ children }: Props): ReactNode => {
    const { bottom } = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const keyboardOffset = { closed: 0, opened: bottom - KEYBOARD_GAP };
    const backdropStyle = { position: 'absolute', top: '100%', right: 0, left: 0, height } satisfies ViewStyle;

    return (
        <KeyboardStickyView style={STICKY_FOOTER_STYLE} offset={keyboardOffset}>
            <View className="bg-surface" style={backdropStyle} pointerEvents="none" />
            <ScreenChromeFooter style={FOOTER_STYLE}>{children}</ScreenChromeFooter>
        </KeyboardStickyView>
    );
};
