import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AnimatedSectionList } from '../../@generic/component/animated-section-list/animated-section-list';
import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../@generic/constant/floating-tab-bar.constant';
import { AccountGridItem } from '../../account/component/account-grid-item/account-grid-item';
import { AccountSectionHeader } from '../../account/component/account-section-header/account-section-header';
import { AccountsEmptyState } from '../../account/component/accounts-empty-state/accounts-empty-state';
import { BankProviderSectionHeader } from '../../account/component/bank-provider-section-header/bank-provider-section-header';
import { CollapsibleNetWorthHeaderScrollSpacer } from '../../account/component/collapsible-net-worth-header-scroll-spacer/collapsible-net-worth-header-scroll-spacer';
import { CryptoCurrencyGroupCard } from '../../account/component/crypto-currency-group-card/crypto-currency-group-card';
import { DebtSectionHeader } from '../../account/component/debt-section-header/debt-section-header';
import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT } from '../../account/constant/collapsible-net-worth-header-scroll-spacer.constant';
import { HomeSectionKindEnum } from '../../account/enum/home-section-kind.enum';
import { AccountRowInterface } from '../../account/interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../account/interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../account/interface/home-account-balance-summary.interface';
import { useAccountsWithBankSyncQuery } from '../../account/query/use-accounts-with-bank-sync.query';
import { useHomeAccountBalancesQuery } from '../../account/query/use-home-account-balances.query';
import { isBankProviderSection } from '../../account/type-guard/is-bank-provider-section.type-guard';
import { isCryptoCurrencyGroup } from '../../account/type-guard/is-crypto-currency-group.type-guard';
import { isDebtSection } from '../../account/type-guard/is-debt-section.type-guard';
import { HomeSectionInterface, buildHomePageSections } from '../../account/utils/build-home-page-sections.util';

const SECTION_KIND_TO_DEBT_TYPE: Record<HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU, AccountDebtTypeEnum> = {
    [HomeSectionKindEnum.DEBT_OWED_TO_YOU]: AccountDebtTypeEnum.LENT,
    [HomeSectionKindEnum.DEBT_YOU_OWE]: AccountDebtTypeEnum.BORROW
};

const getSectionAccountType = (section: HomeSectionInterface): AccountTypeEnum => {
    if (isBankProviderSection(section)) {
        return AccountTypeEnum.BANK_SYNC;
    }

    if (isDebtSection(section)) {
        return AccountTypeEnum.DEBT;
    }

    return section.type;
};

const getSectionTotal = (section: HomeSectionInterface, balanceSummary: HomeAccountBalanceSummaryInterface): number => {
    if (isBankProviderSection(section)) {
        return balanceSummary.bankProviderTotals.get(section.provider) ?? 0;
    }

    if (isDebtSection(section)) {
        const debtType = SECTION_KIND_TO_DEBT_TYPE[section.kind];

        return balanceSummary.debtTypeTotals.get(debtType) ?? 0;
    }

    return balanceSummary.accountTypeTotals.get(section.type) ?? 0;
};

const getCryptoGroupBalance = (group: CryptoCurrencyGroupInterface, balanceSummary: HomeAccountBalanceSummaryInterface): number =>
    group.accounts.reduce((total, account) => total + (balanceSummary.balancesByAccountId.get(account.id)?.balance ?? 0), 0);

const renderHomeSectionHeader = (section: HomeSectionInterface, balanceSummary: HomeAccountBalanceSummaryInterface) => {
    const total = getSectionTotal(section, balanceSummary);

    if (isBankProviderSection(section)) {
        return <BankProviderSectionHeader provider={section.provider} total={total} />;
    }

    if (isDebtSection(section)) {
        return <DebtSectionHeader sectionKind={section.kind} total={total} />;
    }

    return <AccountSectionHeader type={section.type} total={total} />;
};

const renderHomeItem = (
    item: AccountRowInterface | CryptoCurrencyGroupInterface,
    section: HomeSectionInterface,
    balanceSummary: HomeAccountBalanceSummaryInterface
) => {
    if (isCryptoCurrencyGroup(item)) {
        const balance = getCryptoGroupBalance(item, balanceSummary);

        return <CryptoCurrencyGroupCard group={item} balance={balance} balancesByAccountId={balanceSummary.balancesByAccountId} />;
    }

    const accountType = getSectionAccountType(section);
    const leftBalance = balanceSummary.balancesByAccountId.get(item.left.id)?.balance ?? 0;
    const rightAccount = item.right;
    const rightBalance = isDefined(rightAccount) ? (balanceSummary.balancesByAccountId.get(rightAccount.id)?.balance ?? 0) : 0;
    const rightItem = isDefined(rightAccount) ? (
        <AccountGridItem account={rightAccount} balance={rightBalance} type={accountType} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View className="flex-row mb-3">
            <AccountGridItem account={item.left} balance={leftBalance} type={accountType} isLeft />
            {rightItem}
        </View>
    );
};

export default function HomePage() {
    const { accounts } = useAccountsWithBankSyncQuery();
    const balanceSummary = useHomeAccountBalancesQuery();
    const { bottom } = useSafeAreaInsets();

    const scrollY = useSharedValue(0);

    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom;
    const { contentContainerStyle, emptyStateStyle } = useMemo(
        () => ({
            contentContainerStyle: { paddingBottom: bottomPadding, paddingHorizontal: 20 },
            emptyStateStyle: { paddingBottom: bottomPadding }
        }),
        [bottomPadding]
    );

    const { activeAccounts, sections } = useMemo(() => {
        const nextActiveAccounts = accounts.filter(account => account.isActive);

        return {
            activeAccounts: nextActiveAccounts,
            sections: buildHomePageSections(nextActiveAccounts)
        };
    }, [accounts]);
    const listFooterComponent =
        activeAccounts.length > COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_MIN_ACCOUNT_COUNT ? (
            <CollapsibleNetWorthHeaderScrollSpacer />
        ) : null;

    const renderSectionHeader = useCallback(
        ({ section }: { section: HomeSectionInterface }) => renderHomeSectionHeader(section, balanceSummary),
        [balanceSummary]
    );

    const renderItem = useCallback(
        ({ item, section }: { item: AccountRowInterface | CryptoCurrencyGroupInterface; section: HomeSectionInterface }) =>
            renderHomeItem(item, section, balanceSummary),
        [balanceSummary]
    );

    const keyExtractor = useCallback(
        (item: AccountRowInterface | CryptoCurrencyGroupInterface) =>
            isCryptoCurrencyGroup(item) ? `crypto-${item.instrument.id}` : String(item.left.id),
        []
    );

    return (
        <View className="flex-1 bg-background">
            <CollapsibleHeader
                scrollY={scrollY}
                netWorth={balanceSummary.netWorth}
                fiatTotal={balanceSummary.fiatTotal}
                cryptoTotal={balanceSummary.cryptoTotal}
                fiatCount={balanceSummary.fiatCount}
                cryptoCount={balanceSummary.cryptoCount}
            />

            {isNotEmptyArray(sections) ? (
                <AnimatedSectionList<AccountRowInterface | CryptoCurrencyGroupInterface, HomeSectionInterface>
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
