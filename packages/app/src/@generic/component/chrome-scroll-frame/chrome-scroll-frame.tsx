import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { CollapsibleHeaderBackdrop } from '../collapsible-header-backdrop/collapsible-header-backdrop';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ChromeScrollFrame = ({ children }: Props) => (
    <ScreenChromeThemeProvider syncNativeScrollOffset>
        <ScreenChromeFrame>
            <ScreenChromeScrollView contentInsetTop={SCREEN_CHROME_CONTENT_INSET_TOP} showsVerticalScrollIndicator={false}>
                <View className="gap-y-7xl pb-5xl">{children}</View>
            </ScreenChromeScrollView>

            <CollapsibleHeaderBackdrop />
        </ScreenChromeFrame>
    </ScreenChromeThemeProvider>
);
