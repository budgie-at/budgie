import { View } from 'react-native';

import { useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ChromeKeyboardScrollView } from '../chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
}

const CONTENT_BOTTOM_CLEARANCE = 16;

export const FixedChromeScroll = ({ children, testID }: Props) => {
    const { chromeHeight } = useBottomChromeInset();
    const { config } = useScreenChrome();
    const contentInsetBottom = chromeHeight + CONTENT_BOTTOM_CLEARANCE;

    return (
        <ChromeKeyboardScrollView
            contentInsetTop={config.headerHeight}
            contentInsetBottom={contentInsetBottom}
            bottomOffset={contentInsetBottom}
            showsVerticalScrollIndicator={false}
            testID={testID}
        >
            <View className="gap-y-[32px] px-5xl pt-xl">{children}</View>
        </ChromeKeyboardScrollView>
    );
};
