import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { CollapsibleChromePinnedBar } from '../../../@generic/component/collapsible-chrome-pinned-bar/collapsible-chrome-pinned-bar';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../@generic/constant/floating-tab-bar.constant';
import { CollapsibleChromeCollapseDistanceContext } from '../../../@generic/context/collapsible-chrome-collapse-distance.context';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { getCollapsibleChromePinDistance } from '../../../@generic/utils/get-collapsible-chrome-pin-distance.util';
import { YieldPayoutsScrollContext } from '../../context/yield-payouts-scroll.context';
import { YieldListItemKindEnum } from '../../enum/yield-list-item-kind.enum';
import { useYieldListItems } from '../../hook/use-yield-list-items.hook';
import { YieldBreakdown } from '../yield-breakdown/yield-breakdown';
import { YieldChartCard } from '../yield-chart-card/yield-chart-card';
import { YieldDateHeader } from '../yield-date-header/yield-date-header';
import { YieldHero } from '../yield-hero/yield-hero';
import { YieldPayoutRow } from '../yield-payout-row/yield-payout-row';
import { YieldPositionRow } from '../yield-position-row/yield-position-row';
import { YieldRangeControl } from '../yield-range-control/yield-range-control';
import { YieldSectionHeader } from '../yield-section-header/yield-section-header';
import { YieldSkeletonRow } from '../yield-skeleton-row/yield-skeleton-row';

import type { YieldListItemType } from '../../type/yield-list-item.type';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { LayoutChangeEvent } from 'react-native';

const keyExtractor = (item: YieldListItemType) => item.id;

const getItemType = (item: YieldListItemType) => item.kind;

const ESTIMATED_ITEM_SIZE = 60;

const CONTENT_STYLE = { paddingBottom: FLOATING_TAB_BAR_HEIGHT };

export const YieldScreenList = () => {
    const items = useYieldListItems();
    const [rangeY, setRangeY] = useState(0);
    const [pinnedHeight, setPinnedHeight] = useState(0);
    const listRef = useRef<LegendListRef>(null);
    const { top } = useSafeAreaInsets();
    const isReducedMotion = useReducedMotion();

    const renderItem = ({ item }: { item: YieldListItemType }) => {
        switch (item.kind) {
            case YieldListItemKindEnum.SECTION:
                return <YieldSectionHeader section={item.section} />;
            case YieldListItemKindEnum.DATE:
                return <YieldDateHeader date={item.date} />;
            case YieldListItemKindEnum.POSITION:
                return <YieldPositionRow position={item.position} rangeCaption={item.rangeCaption} rowPosition={item.rowPosition} />;
            case YieldListItemKindEnum.PAYOUT:
                return <YieldPayoutRow transaction={item.transaction} isUnassigned={item.isUnassigned} rowPosition={item.position} />;
            case YieldListItemKindEnum.SKELETON:
            default:
                return <YieldSkeletonRow rowPosition={item.position} />;
        }
    };

    const handlePayoutsScroll = () =>
        void listRef.current?.scrollToIndex({
            index: 0,
            viewPosition: 0,
            viewOffset: getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, top) + pinnedHeight,
            animated: !isReducedMotion
        });

    const handleRangeLayout = (event: LayoutChangeEvent) => void setRangeY(event.nativeEvent.layout.y);

    const spacerStyle = { height: pinnedHeight };
    const listHeader = (
        <View className="pb-[24px]">
            <View style={spacerStyle} onLayout={handleRangeLayout} />
            <View className="gap-y-[24px] pt-md">
                <YieldHero />
                <YieldChartCard />
                <YieldBreakdown />
            </View>
        </View>
    );

    return (
        <>
            <YieldPayoutsScrollContext value={handlePayoutsScroll}>
                <CollapsibleChromeCollapseDistanceContext value={getCollapsibleChromePinDistance(rangeY, top)}>
                    <CollapsibleChromeLegendList
                        ref={listRef}
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        getItemType={getItemType}
                        estimatedItemSize={ESTIMATED_ITEM_SIZE}
                        ListHeaderComponent={listHeader}
                        contentContainerStyle={CONTENT_STYLE}
                    />
                </CollapsibleChromeCollapseDistanceContext>
            </YieldPayoutsScrollContext>

            <CollapsibleChromePinnedBar anchorY={rangeY} onHeightChange={setPinnedHeight}>
                <YieldRangeControl />
            </CollapsibleChromePinnedBar>
        </>
    );
};
