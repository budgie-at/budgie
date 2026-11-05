import { View } from 'react-native';

import { ScreenChromeScrollView, useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ImportScreenScroll = ({ children }: Props) => {
    const { chromeHeight } = useBottomChromeInset();
    const { config } = useScreenChrome();

    const contentInsetBottom = chromeHeight + 24;

    return (
        <ScreenChromeScrollView
            contentInsetTop={config.headerHeight}
            contentInsetBottom={contentInsetBottom}
            keyboardShouldPersistTaps="handled"
        >
            <View className="gap-y-7xl px-5xl pt-xl">{children}</View>
        </ScreenChromeScrollView>
    );
};
