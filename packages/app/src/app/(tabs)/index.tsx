import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { AnimatedSectionList } from '../../@generic/component/animated-section-list/animated-section-list';
import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../@generic/constant/floating-tab-bar.constant';
import { AccountGridItem } from '../../account/component/account-grid-item/account-grid-item';
import { AccountSectionHeader } from '../../account/component/account-section-header/account-section-header';
import { AccountsEmptyState } from '../../account/component/accounts-empty-state/accounts-empty-state';
import { BankProviderSectionHeader } from '../../account/component/bank-provider-section-header/bank-provider-section-header';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../../account/component/collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { DebtSectionHeader } from '../../account/component/debt-section-header/debt-section-header';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../account/constant/collapsible-net-worth-header-scroll-spacer.constant';
import { AccountRowInterface } from '../../account/interface/account-row.interface';
import { useAccountsWithBankSyncQuery } from '../../account/query/use-accounts-with-bank-sync.query';
import { isBankProviderSection } from '../../account/type-guard/is-bank-provider-section.type-guard';
import { isDebtSection } from '../../account/type-guard/is-debt-section.type-guard';
import { HomeSectionInterface, buildHomePageSections } from '../../account/utils/build-home-page-sections.util';

const getSectionAccountType = (section: HomeSectionInterface): AccountTypeEnum => {
    if (isBankProviderSection(section)) {
        return AccountTypeEnum.BANK_SYNC;
    }

    if (isDebtSection(section)) {
        return AccountTypeEnum.DEBT;
    }

    return section.type;
};

export default function HomePage() {
    const { accounts } = useAccountsWithBankSyncQuery();
    const { bottom } = useSafeAreaInsets();

    const scrollY = useSharedValue(0);

    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom;
    const contentContainerStyle = { paddingBottom: bottomPadding, paddingHorizontal: 20 };
    const emptyStateStyle = { paddingBottom: bottomPadding };

    const activeAccounts = accounts.filter(account => account.isActive);
    const sections = buildHomePageSections(activeAccounts);
    const listFooterComponent =
        activeAccounts.length > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const renderSectionHeader = ({ section }: { section: HomeSectionInterface }) => {
        if (isBankProviderSection(section)) {
            return <BankProviderSectionHeader provider={section.provider} />;
        }

        if (isDebtSection(section)) {
            return <DebtSectionHeader sectionKind={section.kind} />;
        }

        return <AccountSectionHeader type={section.type} />;
    };

    const renderItem = ({ item, section }: { item: AccountRowInterface; section: HomeSectionInterface }) => {
        const accountType = getSectionAccountType(section);

        return (
            <View className="flex-row mb-3">
                <AccountGridItem account={item.left} type={accountType} isLeft />
                {item.right ? <AccountGridItem account={item.right} type={accountType} isLeft={false} /> : <View className="flex-1" />}
            </View>
        );
    };

    const keyExtractor = (item: AccountRowInterface) => String(item.left.id);

    return (
        <View className="flex-1 bg-background">
            <CollapsibleHeader scrollY={scrollY} />

            {isNotEmptyArray(sections) ? (
                <AnimatedSectionList
                    scrollY={scrollY}
                    sections={sections}
                    renderSectionHeader={renderSectionHeader}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                    ListFooterComponent={listFooterComponent}
                />
            ) : (
                <View className="flex-1 px-5xl" style={emptyStateStyle}>
                    <AccountsEmptyState />
                </View>
            )}
        </View>
    );
}
