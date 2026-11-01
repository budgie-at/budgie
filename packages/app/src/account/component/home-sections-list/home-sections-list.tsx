import { AccountWithSyncEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { SectionList } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { InstitutionGroupInterface } from '../../interface/institution-group.interface';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { getHomeSectionItemPosition } from '../../utils/get-home-section-item-position.util';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { HomeSectionHeader } from '../home-section-header/home-section-header';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { ReactElement } from 'react';

type HomeSectionsListItem = CryptoCurrencyGroupInterface | InstitutionGroupInterface | AccountWithSyncEntityInterface;

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<HomeSectionsListItem, HomeSectionInterface>);
const LIST_HORIZONTAL_PADDING = 16;

interface Props {
    readonly sections: HomeSectionInterface[];
    readonly activeAccountCount: number;
    readonly isLoading: boolean;
    readonly bottomInset: number;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly listHeaderComponent?: ReactElement;
}

export const HomeSectionsList = ({ sections, activeAccountCount, isLoading, bottomInset, balanceSummary, listHeaderComponent }: Props) => {
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

    const listEmptyComponent = isLoading || activeAccountCount > 0 ? null : AccountsEmptyState;

    const renderSectionHeader = ({ section }: { section: HomeSectionInterface }) => <HomeSectionHeader section={section} />;

    const renderItem = ({ item, index, section }: { item: HomeSectionsListItem; index: number; section: HomeSectionInterface }) => (
        <HomeSectionItem
            item={item}
            section={section}
            balanceSummary={balanceSummary}
            position={getHomeSectionItemPosition(section.data, index)}
        />
    );

    const keyExtractor = (item: HomeSectionsListItem) => {
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
        />
    );
};
