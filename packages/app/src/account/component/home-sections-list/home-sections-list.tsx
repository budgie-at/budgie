import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useCollapsibleChromeScroll } from '../../../@generic/hook/use-collapsible-chrome-scroll.hook';
import { useScreenChromeStickyList } from '../../../@generic/hook/use-screen-chrome-sticky-list.hook';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { HomeListItemKindEnum } from '../../enum/home-list-item-kind.enum';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { HomeHoldingReturnsInterface } from '../../interface/home-holding-returns.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { HomeListItemType } from '../../type/home-list-item.type';
import { buildHomeListItems } from '../../utils/build-home-list-items.util';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeEmptyState } from '../home-empty-state/home-empty-state';
import { HomeSectionFooter } from '../home-section-footer/home-section-footer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionRow } from '../home-section-row/home-section-row';

import type { ReactElement } from 'react';

const LIST_HORIZONTAL_PADDING = 16;
const HOME_ROW_ESTIMATED_ITEM_SIZE = 68;

const keyExtractor = (item: HomeListItemType) => item.id;

const getItemType = (item: HomeListItemType) => item.type;

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly isLoading: boolean;
    readonly bottomInset: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly holdingReturns: HomeHoldingReturnsInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = (props: Props) => {
    const { sections, activeAccountCount, isLoading, bottomInset, balancesByAccountId, holdingReturns, listHeaderComponent } = props;
    const { top } = useSafeAreaInsets();
    const { config } = useScreenChrome();
    const { onScroll } = useCollapsibleChromeScroll();
    const collapsedHeaderHeight = config.collapsedHeaderHeight ?? config.headerHeight;
    const listStyle = { marginTop: top + collapsedHeaderHeight };
    const { ref: refScrollView, ...scrollProps } = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetTop: config.headerHeight - collapsedHeaderHeight,
        contentContainerStyle: {
            paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN * 2 + bottomInset,
            paddingHorizontal: LIST_HORIZONTAL_PADDING,
            flexGrow: 1
        }
    });
    const listFooterComponent =
        activeAccountCount > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const listEmptyComponent = isLoading || activeAccountCount > 0 ? null : HomeEmptyState;

    const { items, headerIndices } = buildHomeListItems(sections);
    const renderStickyHeader = (position: number) => {
        const section = sections.at(position);

        return isDefined(section) ? <HomeSectionHeader section={section} holdingReturns={holdingReturns} /> : null;
    };
    const stickySource = {
        indices: headerIndices,
        horizontalInset: LIST_HORIZONTAL_PADDING,
        contentKey: sections,
        extraContentKey: holdingReturns,
        renderHeader: renderStickyHeader
    };
    const { handleListRef, onMetricsChange, publish, stickyHeaderConfig } = useScreenChromeStickyList(
        stickySource,
        config.headerHeight - collapsedHeaderHeight,
        collapsedHeaderHeight
    );

    const renderItem = ({ item }: { item: HomeListItemType }) => {
        if (item.type === HomeListItemKindEnum.HEADER) {
            return <HomeSectionHeader section={item.section} holdingReturns={holdingReturns} />;
        }

        return item.type === HomeListItemKindEnum.FOOTER ? (
            <HomeSectionFooter section={item.section} />
        ) : (
            <HomeSectionRow
                item={item.item}
                index={item.index}
                section={item.section}
                balancesByAccountId={balancesByAccountId}
                holdingReturns={holdingReturns}
            />
        );
    };

    return (
        <AnimatedLegendList
            data={items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            estimatedItemSize={HOME_ROW_ESTIMATED_ITEM_SIZE}
            stickyHeaderIndices={headerIndices}
            extraData={holdingReturns}
            refScrollView={refScrollView}
            ref={handleListRef}
            onMetricsChange={onMetricsChange}
            onItemSizeChanged={publish}
            onViewableItemsChanged={publish}
            stickyHeaderConfig={stickyHeaderConfig}
            showsVerticalScrollIndicator={false}
            recycleItems
            ListHeaderComponent={listHeaderComponent}
            ListFooterComponent={listFooterComponent}
            ListEmptyComponent={listEmptyComponent}
            {...scrollProps}
            onScroll={onScroll}
            style={listStyle}
        />
    );
};
