import { ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode, RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly scrollRef: RefObject<ScrollView | null>;
    readonly onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    readonly minimumHeight: number;
}

export const TransactionInfoScrollView = ({ children, scrollRef, onScrollEnd, minimumHeight }: Props) => {
    const { config } = useScreenChrome();
    const contentContainerStyle = { minHeight: minimumHeight };

    return (
        <ScreenChromeScrollView
            ref={scrollRef}
            contentInsetTop={config.headerHeight}
            contentInsetBottom={32}
            contentContainerStyle={contentContainerStyle}
            onScrollEndDrag={onScrollEnd}
            onMomentumScrollEnd={onScrollEnd}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScreenChromeScrollView>
    );
};
