import { AccountTypeEnum, AccountWithBankSyncEntityInterface, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { typedObjectEntries } from '../../@generic/utils/typed-object-entries.util';
import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { AccountRowInterface } from '../interface/account-row.interface';
import { BankProviderSectionWithStatusInterface } from '../interface/bank-provider-section.interface';

interface AccountTypeSectionInterface {
    readonly kind: HomeSectionKindEnum.ACCOUNT_TYPE;
    readonly type: AccountTypeEnum;
    readonly data: AccountRowInterface[];
}

export interface DebtSectionInterface {
    readonly kind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly data: AccountRowInterface[];
}

export type HomeSectionInterface = AccountTypeSectionInterface | BankProviderSectionWithStatusInterface | DebtSectionInterface;

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithBankSyncEntityInterface[]>>;
type ProviderGroups = Partial<Record<ExternalSourceEnum, AccountWithBankSyncEntityInterface[]>>;

const pairAccountsIntoRows = (accounts: AccountWithBankSyncEntityInterface[]): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let i = 0; i < accounts.length; i += 2) {
        rows.push({
            left: accounts[i],
            right: accounts[i + 1]
        });
    }

    return rows;
};

const getProviderSyncStatus = (accounts: AccountWithBankSyncEntityInterface[]): BankSyncStatusEnum => {
    const hasSyncing = accounts.some(account => account.bankSync?.status === BankSyncStatusEnum.SYNCING);
    if (hasSyncing) {
        return BankSyncStatusEnum.SYNCING;
    }

    const hasFailed = accounts.some(account => account.bankSync?.status === BankSyncStatusEnum.FAILED);
    if (hasFailed) {
        return BankSyncStatusEnum.FAILED;
    }

    return BankSyncStatusEnum.IDLE;
};

export const buildHomePageSections = (accounts: AccountWithBankSyncEntityInterface[]): HomeSectionInterface[] => {
    const nonBankSyncAccounts = accounts.filter(account => account.type !== AccountTypeEnum.BANK_SYNC);
    const bankSyncAccounts = accounts.filter(account => account.type === AccountTypeEnum.BANK_SYNC);

    const accountGroups = nonBankSyncAccounts.reduce<AccountGroups>(
        (accumulator, account) => ({
            ...accumulator,
            [account.type]: [...(accumulator[account.type] ?? []), account]
        }),
        {}
    );

    const providerGroups = bankSyncAccounts.reduce<ProviderGroups>((accumulator, account) => {
        const provider = account.bankSync?.provider;
        if (!isDefined(provider)) {
            return accumulator;
        }

        return {
            ...accumulator,
            [provider]: [...(accumulator[provider] ?? []), account]
        };
    }, {});

    const accountTypeSections: AccountTypeSectionInterface[] = typedObjectEntries(accountGroups)
        .filter(([, groupAccounts]) => isNotEmptyArray(groupAccounts))
        .map(([type, groupAccounts]) => ({
            kind: HomeSectionKindEnum.ACCOUNT_TYPE,
            type,
            data: pairAccountsIntoRows(groupAccounts ?? [])
        }));

    const providerSections: BankProviderSectionWithStatusInterface[] = typedObjectEntries(providerGroups)
        .filter(([, groupAccounts]) => isNotEmptyArray(groupAccounts))
        .map(([provider, groupAccounts]) => ({
            kind: HomeSectionKindEnum.BANK_PROVIDER,
            provider,
            syncStatus: getProviderSyncStatus(groupAccounts ?? []),
            data: pairAccountsIntoRows(groupAccounts ?? [])
        }));

    return [...accountTypeSections, ...providerSections];
};
