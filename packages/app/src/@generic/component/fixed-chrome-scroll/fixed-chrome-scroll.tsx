import { View } from 'react-native';

import { useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ChromeKeyboardScrollView } from '../chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
    readonly footerHeight?: number;
}

const CONTENT_BOTTOM_CLEARANCE = 16;
const FOCUSED_FIELD_CLEARANCE = 24;

export const FixedChromeScroll = ({ children, testID, footerHeight = 0 }: Props) => {
    const { chromeHeight } = useBottomChromeInset();
    const { config } = useScreenChrome();
    const contentInsetBottom = Math.max(chromeHeight, footerHeight) + CONTENT_BOTTOM_CLEARANCE;
    const bottomOffset = contentInsetBottom + FOCUSED_FIELD_CLEARANCE;

    return (
        <ChromeKeyboardScrollView
            contentInsetTop={config.headerHeight}
            contentInsetBottom={contentInsetBottom}
            bottomOffset={bottomOffset}
            showsVerticalScrollIndicator={false}
            testID={testID}
        >
            <View className="gap-y-[32px] px-5xl pt-xl">{children}</View>
        </ChromeKeyboardScrollView>
    );
};
