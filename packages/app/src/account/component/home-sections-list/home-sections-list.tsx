import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { AnimatedSectionList } from '../../../@generic/component/animated-section-list/animated-section-list';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { AccountRowInterface } from '../../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isCryptoCurrencyGroup } from '../../type-guard/is-crypto-currency-group.type-guard';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { ReactElement } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly scrollY: SharedValue<number>;
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly bottomInset: number;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({ scrollY, sections, activeAccountCount, bottomInset, balanceSummary, listHeaderComponent }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottomInset;
    const contentContainerStyle = { paddingBottom: bottomPadding, paddingHorizontal: 20 };
    const emptyStateStyle = { paddingBottom: bottomPadding };
    const listFormatKey = `${defaultInstrument.id}-${decimalPlaces}`;
    const listFooterComponent =
        activeAccountCount > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const renderSectionHeader = ({ section }: { section: HomeSectionInterface }) => (
        <HomeSectionHeader section={section} balanceSummary={balanceSummary} />
    );

    const renderItem = ({ item, section }: { item: AccountRowInterface | CryptoCurrencyGroupInterface; section: HomeSectionInterface }) => (
        <HomeSectionItem item={item} section={section} balanceSummary={balanceSummary} />
    );

    const keyExtractor = (item: AccountRowInterface | CryptoCurrencyGroupInterface) =>
        isCryptoCurrencyGroup(item) ? `crypto-${item.instrument.id}` : String(item.left.id);

    if (!isNotEmptyArray(sections)) {
        return (
            <View className="flex-1 px-5xl" style={emptyStateStyle}>
                {listHeaderComponent}
                <AccountsEmptyState />
            </View>
        );
    }

    return (
        <AnimatedSectionList<AccountRowInterface | CryptoCurrencyGroupInterface, HomeSectionInterface>
            key={listFormatKey}
            scrollY={scrollY}
            sections={sections}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            extraData={listFormatKey}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={listHeaderComponent}
            ListFooterComponent={listFooterComponent}
        />
    );
};
