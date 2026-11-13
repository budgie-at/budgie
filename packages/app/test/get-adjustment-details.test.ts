import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountTypeEnum,
    CategorySourceEnum,
    InstrumentTypeEnum,
    PERSONAL_SYNC_ZONE,
    SyncModeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { getAdjustmentDetails } from '../src/transaction/utils/get-adjustment-details.util';

import type { AccountWithInstrumentEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

type SyncInput = NonNullable<Parameters<typeof getAdjustmentDetails>[1]>;

const OPERATED_AT = new Date('2026-10-10T12:00:00Z');
const AMOUNT = 25_000_000;
const TIMESTAMP = new Date('2026-10-01T00:00:00Z');

const buildAccount = (type: AccountTypeEnum): AccountWithInstrumentEntityInterface => ({
    id: 1,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
    syncId: 'account-sync-id',
    syncZone: PERSONAL_SYNC_ZONE,
    icon: UserIconNameEnum.Home,
    parentId: null,
    order: 0,
    title: 'Account',
    titleSearch: 'account',
    type,
    nature: AccountNatureEnum.ASSET,
    debtType: AccountDebtTypeEnum.LENT,
    instrumentId: 1,
    externalId: null,
    contactId: null,
    deadline: null,
    targetBalance: 0,
    targetBaseInstrumentId: null,
    targetBaseExchangeRate: null,
    targetBaseAmount: null,
    interestRate: null,
    installmentCount: null,
    externalSource: null,
    integrationId: null,
    iban: null,
    includeInNetWorth: true,
    isActive: true,
    isExternal: false,
    instrument: {
        id: 1,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
        type: InstrumentTypeEnum.FIAT,
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        priceProvider: null,
        providerInstrumentId: null,
        quoteInstrumentId: null,
        marketCapRank: null
    }
});

const buildAdjustment = (accountType: AccountTypeEnum): TransactionWithRelationsEntityInterface => {
    const account = buildAccount(accountType);

    return {
        id: 7,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
        syncId: 'transaction-sync-id',
        syncZone: PERSONAL_SYNC_ZONE,
        type: TransactionTypeEnum.ADJUSTMENT,
        title: 'Balance adjustment',
        externalId: null,
        operatedAt: OPERATED_AT,
        comment: '',
        toAccountId: account.id,
        fromAccountId: null,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false,
        importFingerprint: null,
        consolidationParentTransactionId: null,
        consolidationType: null,
        fundAccountId: null,
        yieldKind: null,
        yieldSourceAccountId: null,
        operatedWeekday: 6,
        operatedMinuteOfDay: 720,
        entries: [
            {
                id: 1,
                createdAt: TIMESTAMP,
                updatedAt: TIMESTAMP,
                deletedAt: null,
                syncId: 'entry-sync-id',
                syncZone: PERSONAL_SYNC_ZONE,
                type: TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                accountId: account.id,
                categoryId: null,
                categorySource: CategorySourceEnum.USER,
                mccCategoryId: null,
                sequence: 0,
                transactionId: 7,
                amount: AMOUNT,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null,
                quotedInstrumentId: null,
                quotedAmount: null,
                quotedUnitPrice: null,
                operationInstrumentId: null,
                operationAmount: null,
                toIban: null,
                providerBalance: null,
                originalTransactionId: null,
                account,
                category: null,
                mccCategory: null
            }
        ],
        debtEvents: [],
        fromAccount: null,
        toAccount: account,
        receipt: null,
        transactionTags: []
    };
};

const buildSync = (overrides: Partial<SyncInput>): SyncInput => ({
    mode: SyncModeEnum.FORWARD,
    setupBalance: null,
    reconciledAt: null,
    reconciledBalance: null,
    reconciliationTransactionId: null,
    ...overrides
});

describe('adjustment details balance fixing', () => {
    it('leaves a manual account without sync unfixed', () => {
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.CASH), null)?.isBalanceFixed).toBe(false);
    });

    it('fixes a bank-authoritative account regardless of sync', () => {
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.CRYPTO_SYNC), null)?.isBalanceFixed).toBe(true);
    });

    it('fixes the balance while the initial history import pins it to the setup balance', () => {
        const sync = buildSync({ mode: SyncModeEnum.BACKWARD, setupBalance: 100_000_000 });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(true);
    });

    it('leaves a backward-syncing account without a setup balance unfixed', () => {
        const sync = buildSync({ mode: SyncModeEnum.BACKWARD });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(false);
    });

    it('leaves a forward-syncing account with a leftover setup balance unfixed', () => {
        const sync = buildSync({ setupBalance: 100_000_000 });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(false);
    });

    it('fixes an adjustment at or before the forward reconciliation point only', () => {
        const reconciledAt = new Date('2026-10-10T12:00:00Z');
        const reconciled = buildSync({ reconciledAt, reconciledBalance: AMOUNT });
        const earlier = buildSync({ reconciledAt: new Date('2026-10-09T12:00:00Z'), reconciledBalance: AMOUNT });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), reconciled)?.isBalanceFixed).toBe(true);
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), earlier)?.isBalanceFixed).toBe(false);
    });
});
