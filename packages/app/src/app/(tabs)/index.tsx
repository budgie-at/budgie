import { AccountTypeEnum, AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { NetWorthCollapsibleHeader } from '../../account/component/net-worth-collapsible-header/net-worth-collapsible-header';
import { HomeSectionKindEnum } from '../../account/enum/home-section-kind.enum';
import { BankProviderGroupInterface } from '../../account/interface/bank-provider-group.interface';
import { CryptoCurrencyGroupInterface } from '../../account/interface/crypto-currency-group.interface';
import { DebtSectionInterface } from '../../account/interface/debt-section.interface';
import { HomeAccountBalanceSummaryInterface } from '../../account/interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../account/interface/home-section.interface';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { buildIntegrationProviderMap } from '../../account/utils/build-integration-provider-map.util';
import { getDebtProgressDisplayState } from '../../account/utils/get-debt-progress-display-state.util';
import { getDebtSectionKind } from '../../account/utils/get-debt-section-kind.util';
import { pairAccountsIntoRows } from '../../account/utils/pair-accounts-into-rows.util';
import { resolveBankProviderGroup } from '../../account/utils/resolve-bank-provider-group.util';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

const appendAccount = <Key, Value>(groups: Map<Key, Value[]>, key: Key, value: Value): void => {
    const groupValues = groups.get(key);

    if (isDefined(groupValues)) {
        groupValues.push(value);

        return;
    }

    groups.set(key, [value]);
};

const appendBankProviderGroup = (
    groups: Map<number, BankProviderGroupInterface>,
    bankProviderGroup: NonNullable<ReturnType<typeof resolveBankProviderGroup>>,
    account: AccountWithSyncEntityInterface
): void => {
    const { integrationId, provider } = bankProviderGroup;
    const group = groups.get(integrationId);

    if (isDefined(group)) {
        group.accounts.push(account);

        return;
    }

    groups.set(integrationId, { integrationId, provider, accounts: [account] });
};

const groupCryptoAccountsByInstrument = (accounts: AccountWithSyncEntityInterface[]): CryptoCurrencyGroupInterface[] => {
    const groups = new Map<number, CryptoCurrencyGroupInterface>();

    accounts.forEach(account => {
        const group = groups.get(account.instrument.id);

        if (isDefined(group)) {
            group.accounts.push(account);

            return;
        }

        groups.set(account.instrument.id, {
            instrument: account.instrument,
            accounts: [account]
        });
    });

    return [...groups.values()];
};

const isSettledDebtAccount = (
    account: Pick<AccountWithSyncEntityInterface, 'id' | 'type'>,
    balanceSummary: Pick<HomeAccountBalanceSummaryInterface, 'balancesByAccountId'>,
    decimalPlaces: number
): boolean => {
    const debtProgressSummary = balanceSummary.balancesByAccountId.get(account.id)?.debtProgressSummary;

    return (
        account.type === AccountTypeEnum.DEBT &&
        isDefined(debtProgressSummary) &&
        getDebtProgressDisplayState(debtProgressSummary, decimalPlaces).isSettled
    );
};

const buildHomePageSections = (
    accounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>
): HomeSectionInterface[] => {
    const accountGroups = new Map<AccountTypeEnum, AccountWithSyncEntityInterface[]>();
    const providerGroups = new Map<number, BankProviderGroupInterface>();
    const debtGroups = new Map<DebtSectionInterface['kind'], AccountWithSyncEntityInterface[]>();
    const debtSectionKinds = [
        HomeSectionKindEnum.DEBT_YOU_OWE,
        HomeSectionKindEnum.DEBT_OWED_TO_YOU
    ] satisfies DebtSectionInterface['kind'][];

    accounts.forEach(account => {
        if (account.type === AccountTypeEnum.DEBT) {
            appendAccount(debtGroups, getDebtSectionKind(account.debtType), account);

            return;
        }

        const bankProviderGroup = resolveBankProviderGroup(account.integrationId, integrationProviders);

        if (isDefined(bankProviderGroup)) {
            appendBankProviderGroup(providerGroups, bankProviderGroup, account);

            return;
        }

        appendAccount(accountGroups, account.type, account);
    });

    const sections: HomeSectionInterface[] = [];

    accountGroups.forEach((groupAccounts, type) => {
        sections.push({
            kind: HomeSectionKindEnum.ACCOUNT_TYPE,
            type,
            data: type === AccountTypeEnum.CRYPTO ? groupCryptoAccountsByInstrument(groupAccounts) : pairAccountsIntoRows(groupAccounts)
        });
    });

    debtSectionKinds.forEach(kind => {
        const groupAccounts = debtGroups.get(kind);

        if (isNotEmptyArray(groupAccounts)) {
            sections.push({
                kind,
                data: groupAccounts
            });
        }
    });

    providerGroups.forEach(group => {
        sections.push({
            kind: HomeSectionKindEnum.BANK_PROVIDER,
            provider: group.provider,
            integrationId: group.integrationId,
            data: pairAccountsIntoRows(group.accounts)
        });
    });

    return sections;
};

export default function HomePage() {
    const { accounts, balanceSummary } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const scrollY = useSharedValue(0);
    const { decimalPlaces } = useSettingsContext();
    const onboardingHref = useOnboardingRedirect();

    if (isDefined(onboardingHref)) {
        return <Redirect href={onboardingHref} />;
    }

    const displayedAccounts = accounts.filter(account => account.isActive && !isSettledDebtAccount(account, balanceSummary, decimalPlaces));
    const integrationProviders = buildIntegrationProviderMap(accounts);
    const sections = buildHomePageSections(displayedAccounts, integrationProviders);
    const listHeaderComponent = (
        <View className="mb-3xl gap-y-3xl">
            <BudgetWidget />
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <NetWorthCollapsibleHeader
                scrollY={scrollY}
                netWorth={balanceSummary.netWorth}
                fiatTotal={balanceSummary.fiatTotal}
                cryptoTotal={balanceSummary.cryptoTotal}
                fiatCount={balanceSummary.fiatCount}
                cryptoCount={balanceSummary.cryptoCount}
            />

            <HomeSectionsList
                scrollY={scrollY}
                sections={sections}
                activeAccountCount={displayedAccounts.length}
                bottomInset={bottom}
                balanceSummary={balanceSummary}
                listHeaderComponent={listHeaderComponent}
            />
        </View>
    );
}
