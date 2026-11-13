import { ReactNode } from 'react';
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
    const keyboardOffset = { closed: 0, opened: bottom - KEYBOARD_GAP };

    return (
        <KeyboardStickyView style={STICKY_FOOTER_STYLE} offset={keyboardOffset}>
            <ScreenChromeFooter style={FOOTER_STYLE}>{children}</ScreenChromeFooter>
        </KeyboardStickyView>
    );
};
