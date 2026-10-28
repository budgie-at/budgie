import { AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { SectionList, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { AccountRowInterface } from '../../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { ReactElement } from 'react';

type HomeSectionsListItem = AccountRowInterface | CryptoCurrencyGroupInterface | AccountWithSyncEntityInterface;

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<HomeSectionsListItem, HomeSectionInterface>);
const LIST_HORIZONTAL_PADDING = 16;

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly bottomInset: number;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({ sections, activeAccountCount, bottomInset, balanceSummary, listHeaderComponent }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottomInset;
    const scrollProps = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentContainerStyle: { paddingBottom: bottomPadding, paddingHorizontal: LIST_HORIZONTAL_PADDING, flexGrow: 1 }
    });
    const listFormatKey = `${defaultInstrumentId}-${decimalPlaces}`;
    const listFooterComponent =
        activeAccountCount > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const renderSectionHeader = ({ section }: { section: HomeSectionInterface }) => (
        <HomeSectionHeader section={section} balanceSummary={balanceSummary} />
    );

    const renderItem = ({ item, section }: { item: HomeSectionsListItem; section: HomeSectionInterface }) => (
        <HomeSectionItem item={item} section={section} balanceSummary={balanceSummary} />
    );

    const renderSectionFooter = () => <View className="h-[16px]" />;

    const keyExtractor = (item: HomeSectionsListItem) => {
        if ('type' in item) {
            return `debt-${item.id}`;
        }

        return 'accounts' in item ? `crypto-${item.instrument.id}` : String(item.left.id);
    };

    return (
        <AnimatedSectionList
            key={listFormatKey}
            sections={sections}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            renderSectionFooter={renderSectionFooter}
            keyExtractor={keyExtractor}
            extraData={listFormatKey}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
            ListHeaderComponent={listHeaderComponent}
            ListFooterComponent={listFooterComponent}
            ListEmptyComponent={AccountsEmptyState}
            {...scrollProps}
        />
    );
};
