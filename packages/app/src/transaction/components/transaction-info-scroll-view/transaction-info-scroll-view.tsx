import { ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_SCROLL_BOTTOM_INSET } from '../../constant/transaction-info-scroll-bottom-inset.constant';

import type { ReactNode } from 'react';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef, ScrollHandlerProcessed } from 'react-native-reanimated';

interface Props {
    readonly children: ReactNode;
    readonly scrollRef: AnimatedRef<Animated.ScrollView>;
    readonly onScrollEnd: ScrollHandlerProcessed;
    readonly minimumHeight: number;
}

export const TransactionInfoScrollView = ({ children, scrollRef, onScrollEnd, minimumHeight }: Props) => {
    const { config } = useScreenChrome();
    const contentContainerStyle = { minHeight: minimumHeight };

    return (
        <ScreenChromeScrollView
            ref={scrollRef}
            contentInsetTop={config.headerHeight}
            contentInsetBottom={TRANSACTION_INFO_SCROLL_BOTTOM_INSET}
            contentContainerStyle={contentContainerStyle}
            onScrollEndDrag={onScrollEnd}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScreenChromeScrollView>
    );
};
