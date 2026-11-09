import { use, useEffect, useEffectEvent, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { StickySectionHeaderBackdrop } from '../component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { ScreenChromeStickyHeadersContext } from '../context/screen-chrome-sticky-headers.context';
import { getScreenChromeStickyLine } from '../utils/get-screen-chrome-sticky-line.util';

import type { ScreenChromeStickyHeaderInterface } from '../interface/screen-chrome-sticky-header.interface';
import type { LegendListMetrics, LegendListRef } from '@legendapp/list/react-native';

export const useScreenChromeStickyList = (
    headers: readonly ScreenChromeStickyHeaderInterface[],
    contentInsetTop: number,
    headerHeightAboveList: number,
    horizontalInset: number
) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const { config } = useScreenChrome();
    const { top } = useSafeAreaInsets();
    const listRef = useRef<Pick<LegendListRef, 'getState'> | null>(null);
    const headerHeight = useSharedValue(0);

    const publish = () => {
        const state = listRef.current?.getState();

        context?.metrics.set(
            headers.map(header => ({
                offset: (state?.positionAtIndex(header.index) ?? Number.POSITIVE_INFINITY) + headerHeight.get() + contentInsetTop,
                height: state?.sizeAtIndex(header.index) ?? 0
            }))
        );
    };
    const handleListRef = (list: Pick<LegendListRef, 'getState'> | null) => {
        listRef.current = list;
    };
    const onMetricsChange = (metrics: LegendListMetrics) => {
        headerHeight.set(metrics.headerSize);
        publish();
    };
    const publishLayout = useEffectEvent(publish);

    useEffect(() => {
        context?.setSource({ headers, horizontalInset });
        context?.viewportTop.set(top + headerHeightAboveList);
        publishLayout();
    }, [context, headers, top, contentInsetTop, headerHeightAboveList, horizontalInset]);

    const handleUnmount = useEffectEvent(() => {
        context?.setSource(null);
        context?.metrics.set([]);
    });
    useEffect(() => () => void handleUnmount(), []);

    return {
        handleListRef,
        onMetricsChange,
        publish,
        stickyHeaderConfig: {
            offset:
                getScreenChromeStickyLine(headerHeightAboveList, config.collapsedHeaderHeight ?? config.headerHeight) -
                headerHeightAboveList,
            backdropComponent: StickySectionHeaderBackdrop
        }
    };
};
