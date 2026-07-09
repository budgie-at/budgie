import { AccountDebtTypeEnum, AccountTypeEnum, AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { HomeSectionKindEnum } from '../../account/enum/home-section-kind.enum';
import { CryptoCurrencyGroupInterface } from '../../account/interface/crypto-currency-group.interface';
import { DebtSectionInterface } from '../../account/interface/debt-section.interface';
import { HomeSectionInterface } from '../../account/interface/home-section.interface';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { pairAccountsIntoRows } from '../../account/utils/pair-accounts-into-rows.util';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useSetting } from '../../settings/hook/use-setting.hook';

const appendAccount = <Key, Value>(groups: Map<Key, Value[]>, key: Key, value: Value): void => {
    const groupValues = groups.get(key);

    if (isDefined(groupValues)) {
        groupValues.push(value);

        return;
    }

    groups.set(key, [value]);
};

const groupCryptoAccountsByInstrument = (accounts: AccountWithBankSyncEntityInterface[]): CryptoCurrencyGroupInterface[] => {
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

const buildHomePageSections = (accounts: AccountWithBankSyncEntityInterface[]): HomeSectionInterface[] => {
    const accountGroups = new Map<AccountTypeEnum, AccountWithBankSyncEntityInterface[]>();
    const providerGroups = new Map<ExternalSourceEnum, AccountWithBankSyncEntityInterface[]>();
    const debtGroups = new Map<DebtSectionInterface['kind'], AccountWithBankSyncEntityInterface[]>();
    const debtSectionKinds = [
        HomeSectionKindEnum.DEBT_YOU_OWE,
        HomeSectionKindEnum.DEBT_OWED_TO_YOU
    ] satisfies DebtSectionInterface['kind'][];

    accounts.forEach(account => {
        if (account.type === AccountTypeEnum.BANK_SYNC) {
            const provider = account.bankSync?.provider;

            if (isDefined(provider)) {
                appendAccount(providerGroups, provider, account);
            }

            return;
        }

        if (account.type === AccountTypeEnum.DEBT) {
            const kind =
                account.debtType === AccountDebtTypeEnum.BORROW ? HomeSectionKindEnum.DEBT_YOU_OWE : HomeSectionKindEnum.DEBT_OWED_TO_YOU;

            appendAccount(debtGroups, kind, account);

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
                data: pairAccountsIntoRows(groupAccounts)
            });
        }
    });

    providerGroups.forEach((groupAccounts, provider) => {
        sections.push({
            kind: HomeSectionKindEnum.BANK_PROVIDER,
            provider,
            data: pairAccountsIntoRows(groupAccounts)
        });
    });

    return sections;
};

export default function HomePage() {
    const { accounts, balanceSummary } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const scrollY = useSharedValue(0);
    const language = useSetting('language');
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const focusKey = useFocusKey();
    const activeAccounts = accounts.filter(account => account.isActive);
    const sections = buildHomePageSections(activeAccounts);
    const budgetWidgetRemountKey = `${language}-${isBudgetWidgetEnabled ? 'enabled' : 'disabled'}-${focusKey}`;
    const listHeaderComponent = (
        <View className="mb-3xl">
            <BudgetWidget key={budgetWidgetRemountKey} />
        </View>
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

            <HomeSectionsList
                scrollY={scrollY}
                sections={sections}
                activeAccountCount={activeAccounts.length}
                bottomInset={bottom}
                balanceSummary={balanceSummary}
                listHeaderComponent={listHeaderComponent}
            />
        </View>
    );
}
