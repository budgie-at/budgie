import { View } from 'react-native';

import { ScreenChromeScrollView, useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const CONTENT_CLEARANCE = 32;

export const CategorizeInboxScreenScroll = ({ children }: Props) => {
    const { chromeHeight } = useBottomChromeInset();
    const { config } = useScreenChrome();

    const contentInsetBottom = chromeHeight + CONTENT_CLEARANCE;

    return (
        <ScreenChromeScrollView
            contentInsetTop={config.headerHeight}
            contentInsetBottom={contentInsetBottom}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View className="px-5xl">{children}</View>
        </ScreenChromeScrollView>
    );
};
