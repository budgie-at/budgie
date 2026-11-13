import { use, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { CollapsibleChromePinnedBar } from '../../../@generic/component/collapsible-chrome-pinned-bar/collapsible-chrome-pinned-bar';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../@generic/constant/floating-tab-bar.constant';
import { CollapsibleChromeCollapseDistanceContext } from '../../../@generic/context/collapsible-chrome-collapse-distance.context';
import { getCollapsibleChromePinDistance } from '../../../@generic/utils/get-collapsible-chrome-pin-distance.util';
import { YIELD_LIST_ESTIMATED_ITEM_SIZE } from '../../constant/yield-list-estimated-item-size.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldListItemKindEnum } from '../../enum/yield-list-item-kind.enum';
import { useYieldListItems } from '../../hook/use-yield-list-items.hook';
import { YieldBreakdown } from '../yield-breakdown/yield-breakdown';
import { YieldChartCard } from '../yield-chart-card/yield-chart-card';
import { YieldHero } from '../yield-hero/yield-hero';
import { YieldPayoutRow } from '../yield-payout-row/yield-payout-row';
import { YieldPositionRow } from '../yield-position-row/yield-position-row';
import { YieldRangeControl } from '../yield-range-control/yield-range-control';
import { YieldSectionHeader } from '../yield-section-header/yield-section-header';
import { YieldSkeletonRow } from '../yield-skeleton-row/yield-skeleton-row';

import type { YieldListItemType } from '../../type/yield-list-item.type';
import type { LayoutChangeEvent } from 'react-native';

const keyExtractor = (item: YieldListItemType) => item.id;

const getItemType = (item: YieldListItemType) => item.kind;

const CONTENT_STYLE = { paddingBottom: FLOATING_TAB_BAR_HEIGHT };

export const YieldScreenList = () => {
    const { screenKey } = use(YieldScreenContext);
    const items = useYieldListItems(screenKey);
    const [rangeY, setRangeY] = useState(0);
    const [pinnedHeight, setPinnedHeight] = useState(0);
    const { top } = useSafeAreaInsets();

    const renderItem = ({ item }: { item: YieldListItemType }) => {
        switch (item.kind) {
            case YieldListItemKindEnum.SECTION:
                return <YieldSectionHeader section={item.section} />;
            case YieldListItemKindEnum.POSITION:
                return <YieldPositionRow position={item.position} rangeCaption={item.rangeCaption} />;
            case YieldListItemKindEnum.PAYOUT:
                return <YieldPayoutRow transaction={item.transaction} isUnassigned={item.isUnassigned} />;
            case YieldListItemKindEnum.SKELETON:
            default:
                return <YieldSkeletonRow />;
        }
    };

    const handleRangeLayout = (event: LayoutChangeEvent) => void setRangeY(event.nativeEvent.layout.y);

    const spacerStyle = { height: pinnedHeight };
    const listHeader = (
        <View className="pb-[32px]">
            <View style={spacerStyle} onLayout={handleRangeLayout} />
            <View className="gap-y-[24px] pt-md">
                <YieldHero />
                <View className="gap-y-[16px]">
                    <YieldChartCard />
                    <YieldBreakdown />
                </View>
            </View>
        </View>
    );

    return (
        <>
            <CollapsibleChromeCollapseDistanceContext value={getCollapsibleChromePinDistance(rangeY, top)}>
                <CollapsibleChromeLegendList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    estimatedItemSize={YIELD_LIST_ESTIMATED_ITEM_SIZE}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={CONTENT_STYLE}
                />
            </CollapsibleChromeCollapseDistanceContext>

            <CollapsibleChromePinnedBar anchorY={rangeY} onHeightChange={setPinnedHeight}>
                <YieldRangeControl />
            </CollapsibleChromePinnedBar>
        </>
    );
};
