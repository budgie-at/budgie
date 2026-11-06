import { useAtomValue } from '@effect/atom-react/Hooks';
import { SectionList } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useCollapsibleChromeScroll } from '../../../@generic/hook/use-collapsible-chrome-scroll.hook';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { getHomeSectionItemPosition } from '../../utils/get-home-section-item-position.util';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { ReactElement } from 'react';
import type { SectionListRenderItem } from 'react-native';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<HomeSectionInterface['data'][number], HomeSectionInterface>);
const LIST_HORIZONTAL_PADDING = 16;

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly isLoading: boolean;
    readonly bottomInset: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({
    sections,
    activeAccountCount,
    isLoading,
    bottomInset,
    balancesByAccountId,
    listHeaderComponent
}: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { top } = useSafeAreaInsets();
    const { config } = useScreenChrome();
    const { onScroll } = useCollapsibleChromeScroll();
    const collapsedHeaderHeight = config.collapsedHeaderHeight ?? config.headerHeight;
    const listStyle = { marginTop: top + collapsedHeaderHeight };
    const scrollProps = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetTop: config.headerHeight - collapsedHeaderHeight,
        contentContainerStyle: {
            paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottomInset,
            paddingHorizontal: LIST_HORIZONTAL_PADDING,
            flexGrow: 1
        }
    });
    const listFormatKey = `${defaultInstrumentId}-${decimalPlaces}`;
    const listFooterComponent =
        activeAccountCount > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const listEmptyComponent = isLoading || activeAccountCount > 0 ? null : AccountsEmptyState;

    const renderSectionHeader = ({ section }: { section: HomeSectionInterface }) => <HomeSectionHeader section={section} />;

    const renderItem: SectionListRenderItem<HomeSectionInterface['data'][number], HomeSectionInterface> = ({ item, index, section }) => (
        <TransactionRowSurface position={getHomeSectionItemPosition(section.data, index)}>
            <HomeSectionItem item={item} section={section} balancesByAccountId={balancesByAccountId} />
        </TransactionRowSurface>
    );

    const keyExtractor = (item: HomeSectionInterface['data'][number]) => {
        if (isInstitutionGroup(item)) {
            return `institution-${item.integrationId}`;
        }

        return 'accounts' in item ? `crypto-${item.instrument.id}` : String(item.id);
    };

    return (
        <AnimatedSectionList
            key={listFormatKey}
            sections={sections}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            extraData={listFormatKey}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
            ListHeaderComponent={listHeaderComponent}
            ListFooterComponent={listFooterComponent}
            ListEmptyComponent={listEmptyComponent}
            {...scrollProps}
            onScroll={onScroll}
            style={listStyle}
        />
    );
};
