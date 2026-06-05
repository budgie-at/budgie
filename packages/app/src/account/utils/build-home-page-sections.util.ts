import { AccountDebtTypeEnum, AccountTypeEnum, AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { typedObjectEntries } from '../../@generic/utils/typed-object-entries.util';
import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { AccountRowInterface } from '../interface/account-row.interface';
import { BankProviderSectionInterface } from '../interface/bank-provider-section.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';

interface AccountTypeSectionInterface {
    readonly kind: HomeSectionKindEnum.ACCOUNT_TYPE;
    readonly type: AccountTypeEnum;
    readonly data: Array<AccountRowInterface | CryptoCurrencyGroupInterface>;
}

export interface DebtSectionInterface {
    readonly kind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly data: AccountRowInterface[];
}

export type HomeSectionInterface = AccountTypeSectionInterface | BankProviderSectionInterface | DebtSectionInterface;

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithBankSyncEntityInterface[]>>;
type ProviderGroups = Partial<Record<ExternalSourceEnum, AccountWithBankSyncEntityInterface[]>>;

const groupCryptoAccountsByInstrument = (accounts: AccountWithBankSyncEntityInterface[]): CryptoCurrencyGroupInterface[] => {
    const accountGroupsByInstrument = accounts.reduce<Map<number, AccountWithBankSyncEntityInterface[]>>((groups, account) => {
        const groupAccounts = groups.get(account.instrument.id);

        if (isDefined(groupAccounts)) {
            groupAccounts.push(account);

            return groups;
        }

        groups.set(account.instrument.id, [account]);

        return groups;
    }, new Map());

    return [...accountGroupsByInstrument.values()]
        .map(groupAccounts => {
            const firstAccount = groupAccounts.at(0);

            if (!isDefined(firstAccount)) {
                return null;
            }

            return {
                instrument: firstAccount.instrument,
                accounts: groupAccounts
            };
        })
        .filter(isDefined);
};

const pairAccountsIntoRows = (accounts: AccountWithBankSyncEntityInterface[]): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let index = 0; index < accounts.length; index += 2) {
        rows.push({
            left: accounts[index],
            right: accounts[index + 1]
        });
    }

    return rows;
};

const appendAccount = <Key extends string>(
    groups: Partial<Record<Key, AccountWithBankSyncEntityInterface[]>>,
    key: Key,
    account: AccountWithBankSyncEntityInterface
): void => {
    const groupAccounts = groups[key];

    if (isNotEmptyArray(groupAccounts)) {
        groupAccounts.push(account);

        return;
    }

    groups[key] = [account];
};

const appendBankSyncAccount = (account: AccountWithBankSyncEntityInterface, providerGroups: ProviderGroups): boolean => {
    if (account.type !== AccountTypeEnum.BANK_SYNC) {
        return false;
    }

    const provider = account.bankSync?.provider;

    if (isDefined(provider)) {
        appendAccount(providerGroups, provider, account);
    }

    return true;
};

const appendDebtAccount = (
    account: AccountWithBankSyncEntityInterface,
    debtYouOweAccounts: AccountWithBankSyncEntityInterface[],
    debtOwedToYouAccounts: AccountWithBankSyncEntityInterface[]
): boolean => {
    if (account.type !== AccountTypeEnum.DEBT) {
        return false;
    }

    if (account.debtType === AccountDebtTypeEnum.BORROW) {
        debtYouOweAccounts.push(account);
    } else {
        debtOwedToYouAccounts.push(account);
    }

    return true;
};

const buildDebtSections = (
    debtYouOweAccounts: AccountWithBankSyncEntityInterface[],
    debtOwedToYouAccounts: AccountWithBankSyncEntityInterface[]
): DebtSectionInterface[] => {
    const sections: DebtSectionInterface[] = [];

    if (isNotEmptyArray(debtYouOweAccounts)) {
        sections.push({
            kind: HomeSectionKindEnum.DEBT_YOU_OWE,
            data: pairAccountsIntoRows(debtYouOweAccounts)
        });
    }

    if (isNotEmptyArray(debtOwedToYouAccounts)) {
        sections.push({
            kind: HomeSectionKindEnum.DEBT_OWED_TO_YOU,
            data: pairAccountsIntoRows(debtOwedToYouAccounts)
        });
    }

    return sections;
};

export const buildHomePageSections = (accounts: AccountWithBankSyncEntityInterface[]): HomeSectionInterface[] => {
    const accountGroups: AccountGroups = {};
    const providerGroups: ProviderGroups = {};
    const debtYouOweAccounts: AccountWithBankSyncEntityInterface[] = [];
    const debtOwedToYouAccounts: AccountWithBankSyncEntityInterface[] = [];

    accounts.forEach(account => {
        if (appendBankSyncAccount(account, providerGroups)) {
            return;
        }

        if (appendDebtAccount(account, debtYouOweAccounts, debtOwedToYouAccounts)) {
            return;
        }

        appendAccount(accountGroups, account.type, account);
    });

    const accountTypeSections: AccountTypeSectionInterface[] = typedObjectEntries(accountGroups).flatMap(([type, groupAccounts]) => {
        if (!isNotEmptyArray(groupAccounts)) {
            return [];
        }

        return {
            kind: HomeSectionKindEnum.ACCOUNT_TYPE,
            type,
            data: type === AccountTypeEnum.CRYPTO ? groupCryptoAccountsByInstrument(groupAccounts) : pairAccountsIntoRows(groupAccounts)
        };
    });
    const debtSections = buildDebtSections(debtYouOweAccounts, debtOwedToYouAccounts);
    const providerSections: BankProviderSectionInterface[] = typedObjectEntries(providerGroups).flatMap(([provider, groupAccounts]) => {
        if (!isNotEmptyArray(groupAccounts)) {
            return [];
        }

        return {
            kind: HomeSectionKindEnum.BANK_PROVIDER,
            provider,
            data: pairAccountsIntoRows(groupAccounts)
        };
    });

    return [...accountTypeSections, ...debtSections, ...providerSections];
};
