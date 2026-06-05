import { AccountDebtTypeEnum, AccountTypeEnum, AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { AccountRowInterface } from '../interface/account-row.interface';
import { BankProviderSectionInterface } from '../interface/bank-provider-section.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';

import { pairAccountsIntoRows } from './pair-accounts-into-rows.util';

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

export const buildHomePageSections = (accounts: AccountWithBankSyncEntityInterface[]): HomeSectionInterface[] => {
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
