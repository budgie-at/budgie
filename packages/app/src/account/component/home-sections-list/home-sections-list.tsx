import { AccountWithSyncEntityInterface } from '@budgie/contracts';
import { SectionList, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyArray } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useSettingsContext } from '../../../settings/context/settings.context';
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
const LIST_HORIZONTAL_PADDING = 20;

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly bottomInset: number;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({ sections, activeAccountCount, bottomInset, balanceSummary, listHeaderComponent }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottomInset;
    const scrollProps = useScreenChromeScrollProps({
        contentContainerStyle: {
            paddingTop: 0,
            paddingBottom: bottomPadding,
            paddingLeft: LIST_HORIZONTAL_PADDING,
            paddingRight: LIST_HORIZONTAL_PADDING
        }
    });
    const emptyStateStyle = { paddingBottom: bottomPadding };
    const listFormatKey = `${defaultInstrument.id}-${decimalPlaces}`;
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

    const keyExtractor = (item: HomeSectionsListItem) => {
        if ('type' in item) {
            return `debt-${item.id}`;
        }

        return 'accounts' in item ? `crypto-${item.instrument.id}` : String(item.left.id);
    };

    if (!isNotEmptyArray(sections)) {
        return (
            <View className="flex-1 px-5xl" style={emptyStateStyle}>
                {listHeaderComponent}
                <AccountsEmptyState />
            </View>
        );
    }

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
            {...scrollProps}
        />
    );
};
