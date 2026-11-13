import { useAtomValue } from '@effect/atom-react/Hooks';
import { SectionList } from '@legendapp/list/section-list';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useCollapsibleChromeScroll } from '../../../@generic/hook/use-collapsible-chrome-scroll.hook';
import { useScreenChromeStickyList } from '../../../@generic/hook/use-screen-chrome-sticky-list.hook';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { HomeHoldingReturnsInterface } from '../../interface/home-holding-returns.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isHomeHolding } from '../../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { getHomeSectionItemPosition } from '../../utils/get-home-section-item-position.util';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeEmptyState } from '../home-empty-state/home-empty-state';
import { HomeSectionFooter } from '../home-section-footer/home-section-footer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { ReactElement } from 'react';
import type { SectionListProps, SectionListRenderItem } from 'react-native';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<HomeSectionInterface['data'][number], HomeSectionInterface>);
const LIST_HORIZONTAL_PADDING = 16;
const renderSectionFooter: SectionListProps<HomeSectionInterface['data'][number], HomeSectionInterface>['renderSectionFooter'] = ({
    section
}) => <HomeSectionFooter section={section} />;

const keyExtractor = (item: HomeSectionInterface['data'][number]): string => {
    if (isInstitutionGroup(item)) {
        return `institution-${item.integrationId}`;
    }

    return isHomeHolding(item) ? `holding-${item.instrument.id}` : String(item.id);
};

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly isLoading: boolean;
    readonly bottomInset: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly holdingReturns: HomeHoldingReturnsInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({
    sections,
    activeAccountCount,
    isLoading,
    bottomInset,
    balancesByAccountId,
    holdingReturns,
    listHeaderComponent
}: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
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

    const headers = sections.map((section, index) => ({
        index: sections.slice(0, index).reduce((count, previous) => count + previous.data.length + 2, 0),
        content: <HomeSectionHeader section={section} holdingReturns={holdingReturns} />
    }));
    const { handleListRef, onMetricsChange, publish, stickyHeaderConfig } = useScreenChromeStickyList(
        headers,
        config.headerHeight - collapsedHeaderHeight,
        collapsedHeaderHeight,
        LIST_HORIZONTAL_PADDING
    );

    const renderSectionHeader: SectionListProps<HomeSectionInterface['data'][number], HomeSectionInterface>['renderSectionHeader'] = ({
        section
    }) => <HomeSectionHeader section={section} holdingReturns={holdingReturns} />;
    const renderItem: SectionListRenderItem<HomeSectionInterface['data'][number], HomeSectionInterface> = ({ item, index, section }) => (
        <TransactionRowSurface separatorInset={64} position={getHomeSectionItemPosition(section, index)}>
            <HomeSectionItem item={item} section={section} balancesByAccountId={balancesByAccountId} holdingReturns={holdingReturns} />
        </TransactionRowSurface>
    );

    return (
        <AnimatedSectionList
            key={`${defaultInstrumentId}-${decimalPlaces}`}
            sections={sections}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            renderSectionFooter={renderSectionFooter}
            keyExtractor={keyExtractor}
            extraData={holdingReturns}
            refScrollView={refScrollView}
            ref={handleListRef}
            onMetricsChange={onMetricsChange}
            onItemSizeChanged={publish}
            onViewableItemsChanged={publish}
            stickyHeaderConfig={stickyHeaderConfig}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
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
