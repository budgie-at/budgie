import { ScreenChromeScrollView, useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const SCROLL_STYLE = { flex: 1 };

export const ForgotPinScroll = ({ children }: Props) => {
    const { chromeHeight } = useBottomChromeInset();

    return (
        <ScreenChromeScrollView includeTopSafeArea={false} contentInsetBottom={chromeHeight} style={SCROLL_STYLE}>
            {children}
        </ScreenChromeScrollView>
    );
};
