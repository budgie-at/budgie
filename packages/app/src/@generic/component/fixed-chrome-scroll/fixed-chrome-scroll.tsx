import { View } from 'react-native';

import { ScreenChromeScrollView, useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
}

const CONTENT_BOTTOM_CLEARANCE = 24;

export const FixedChromeScroll = ({ children, testID }: Props) => {
    const { chromeHeight } = useBottomChromeInset();
    const { config } = useScreenChrome();
    const contentInsetBottom = chromeHeight + CONTENT_BOTTOM_CLEARANCE;

    return (
        <ScreenChromeScrollView
            contentInsetTop={config.headerHeight}
            contentInsetBottom={contentInsetBottom}
            keyboardShouldPersistTaps="handled"
            testID={testID}
        >
            <View className="gap-y-[32px] px-5xl pt-xl">{children}</View>
        </ScreenChromeScrollView>
    );
};
