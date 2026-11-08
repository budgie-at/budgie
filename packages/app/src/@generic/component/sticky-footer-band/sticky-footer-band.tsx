import { ReactNode } from 'react';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import type { ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;
const FOOTER_STYLE = { position: 'relative' } as const;

export const StickyFooterBand = ({ children }: Props): ReactNode => (
    <KeyboardStickyView style={STICKY_FOOTER_STYLE}>
        <ScreenChromeFooter style={FOOTER_STYLE}>{children}</ScreenChromeFooter>
    </KeyboardStickyView>
);
