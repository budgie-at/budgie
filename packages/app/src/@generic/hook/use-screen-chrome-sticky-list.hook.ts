import { use, useEffect, useEffectEvent, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { StickySectionHeaderBackdrop } from '../component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { ScreenChromeStickyHeadersContext } from '../context/screen-chrome-sticky-headers.context';
import { getScreenChromeStickyLine } from '../utils/get-screen-chrome-sticky-line.util';

import type { ScreenChromeStickyHeaderSourceInterface } from '../interface/screen-chrome-sticky-header-source.interface';
import type { LegendListMetrics, LegendListRef } from '@legendapp/list/react-native';

const areNumberArraysEqual = (left: readonly number[], right: readonly number[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

export const useScreenChromeStickyList = (
    source: ScreenChromeStickyHeaderSourceInterface,
    contentInsetTop: number,
    headerHeightAboveList: number
) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const { config } = useScreenChrome();
    const { top } = useSafeAreaInsets();
    const listRef = useRef<Pick<LegendListRef, 'getState'> | null>(null);
    const headerHeight = useSharedValue(0);
    const lastPublishedRef = useRef<Pick<
        ScreenChromeStickyHeaderSourceInterface,
        'indices' | 'horizontalInset' | 'contentKey' | 'extraContentKey'
    > | null>(null);

    const publish = () => {
        const state = listRef.current?.getState();

        context?.metrics.set(
            source.indices.map(index => ({
                offset: (state?.positionAtIndex(index) ?? Number.POSITIVE_INFINITY) + headerHeight.get() + contentInsetTop,
                height: state?.sizeAtIndex(index) ?? 0
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
    const syncSource = useEffectEvent(() => {
        context?.viewportTop.set(top + headerHeightAboveList);
        const previous = lastPublishedRef.current;
        const isSameSource =
            isDefined(previous) &&
            previous.horizontalInset === source.horizontalInset &&
            previous.contentKey === source.contentKey &&
            previous.extraContentKey === source.extraContentKey &&
            areNumberArraysEqual(previous.indices, source.indices);

        if (!isSameSource) {
            lastPublishedRef.current = {
                indices: source.indices,
                horizontalInset: source.horizontalInset,
                contentKey: source.contentKey,
                extraContentKey: source.extraContentKey
            };
            context?.setSource(source);
            publish();
        }
    });

    useEffect(() => {
        syncSource();
    }, [
        context,
        source.horizontalInset,
        source.contentKey,
        source.extraContentKey,
        source.indices,
        top,
        contentInsetTop,
        headerHeightAboveList
    ]);

    const handleUnmount = useEffectEvent(() => {
        lastPublishedRef.current = null;
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
