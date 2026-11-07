import { useState } from 'react';
import { View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ScreenChromeStickyHeaderOverlay } from '../component/screen-chrome-sticky-header-overlay/screen-chrome-sticky-header-overlay';
import { SCREEN_CHROME_TITLE_CLEARANCE } from '../constant/screen-chrome-config.constant';
import { ScreenChromeStickyHeadersContext } from '../context/screen-chrome-sticky-headers.context';
import { getScreenChromeStickyHeaderState } from '../utils/get-screen-chrome-sticky-header-state.util';

import type { ScreenChromeStickyHeaderMetricInterface } from '../interface/screen-chrome-sticky-header-metric.interface';
import type { ScreenChromeStickyHeaderSourceInterface } from '../interface/screen-chrome-sticky-header-source.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const ScreenChromeStickyHeadersProvider = ({ children }: Props) => {
    const [source, setSource] = useState<ScreenChromeStickyHeaderSourceInterface | null>(null);
    const metrics = useSharedValue<readonly ScreenChromeStickyHeaderMetricInterface[]>([]);
    const viewportTop = useSharedValue(0);
    const headerBottom = useSharedValue(0);
    const protectedBottom = useSharedValue(0);
    const { top } = useSafeAreaInsets();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const defaultAnchor = top + (config.collapsedHeaderHeight ?? config.headerHeight) + SCREEN_CHROME_TITLE_CLEARANCE;
    const anchor = useDerivedValue(() => Math.max(defaultAnchor, headerBottom.get(), protectedBottom.get()));
    const state = useDerivedValue(() =>
        getScreenChromeStickyHeaderState(metrics.get(), scrollY.get() + anchor.get() - Math.max(viewportTop.get(), headerBottom.get()))
    );
    const context = { setSource, metrics, viewportTop, headerBottom, protectedBottom, anchor, state };

    return (
        <ScreenChromeStickyHeadersContext value={context}>
            <View className="flex-1">
                {children}
                <ScreenChromeStickyHeaderOverlay source={source} />
            </View>
        </ScreenChromeStickyHeadersContext>
    );
};
