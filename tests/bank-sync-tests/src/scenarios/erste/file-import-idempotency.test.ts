import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { BankAccountTypeEnum, BankProviderEnum, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';

import { StubFileBankSyncService, testDb } from '../../harness';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

const ERSTE_ACCOUNT_ID = 'AT123';
const ERSTE_EXTERNAL_ID = 'erste-transaction-1';
const ERSTE_LEGACY_EXTERNAL_ID = 'erste-transaction-legacy';
const ERSTE_SECOND_EXTERNAL_ID = 'erste-transaction-2';
const ERSTE_STATEMENT_URI = 'erste-statement.pdf';

const buildErsteBankAccount = (): BankAccountInterface => ({
    id: ERSTE_ACCOUNT_ID,
    provider: BankProviderEnum.ERSTE,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    creditLimit: 0,
    type: BankAccountTypeEnum.CHECKING,
    iban: ERSTE_ACCOUNT_ID
});

const buildErsteTransaction = (externalId = ERSTE_EXTERNAL_ID): BankTransactionInterface => ({
    id: externalId,
    provider: BankProviderEnum.ERSTE,
    accountId: ERSTE_ACCOUNT_ID,
    type: BankTransactionTypeEnum.EXPENSE,
    time: 1_768_302_000,
    description: 'ERSTE CARD PAYMENT',
    comment: 'WIEN, AT',
    mcc: 0,
    originalMcc: 0,
    amount: 42.5,
    operationAmount: 42.5,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    category: '',
    feeAmount: 0
});

class StubErsteFileClient implements FileBasedBankSyncClientInterface {
    constructor(private readonly externalIds = [ERSTE_EXTERNAL_ID]) {}

    getAccounts(): BankAccountInterface[] {
        return [buildErsteBankAccount()];
    }

    getTransactions(): BankTransactionInterface[] {
        return this.externalIds.map(buildErsteTransaction);
    }
}

const buildErsteSyncService = (externalIds = [ERSTE_EXTERNAL_ID]): StubFileBankSyncService =>
    new StubFileBankSyncService(ExternalSourceEnum.ERSTE, new StubErsteFileClient(externalIds));

const fetchImportedErsteTransactionCount = (externalId = ERSTE_EXTERNAL_ID): number =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(and(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE), eq(TransactionEntityTable.externalId, externalId)))
        .all().length;

const fetchImportedErsteTransactionTotalCount = (): number =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE)).all().length;

describe('erste/file-import-idempotency', () => {
    it('keeps one transaction when the same statement import starts twice', async () => {
        const syncService = buildErsteSyncService();

        await Promise.all([
            syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]),
            syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID])
        ]);

        expect(fetchImportedErsteTransactionCount()).toBe(1);
    });

    it('keeps one transaction when the same statement receives a new generated external id', async () => {
        const legacySyncService = buildErsteSyncService([ERSTE_LEGACY_EXTERNAL_ID]);
        const currentSyncService = buildErsteSyncService([ERSTE_EXTERNAL_ID]);

        await legacySyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);
        await currentSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        expect(fetchImportedErsteTransactionTotalCount()).toBe(1);
        expect(fetchImportedErsteTransactionCount()).toBe(1);
    });

    it('does not collapse ambiguous current statement rows into one semantic match', async () => {
        const legacySyncService = buildErsteSyncService([ERSTE_LEGACY_EXTERNAL_ID]);
        const currentSyncService = buildErsteSyncService([ERSTE_EXTERNAL_ID, ERSTE_SECOND_EXTERNAL_ID]);

        await legacySyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);
        await currentSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        expect(fetchImportedErsteTransactionTotalCount()).toBe(3);
        expect(fetchImportedErsteTransactionCount(ERSTE_LEGACY_EXTERNAL_ID)).toBe(1);
        expect(fetchImportedErsteTransactionCount(ERSTE_EXTERNAL_ID)).toBe(1);
        expect(fetchImportedErsteTransactionCount(ERSTE_SECOND_EXTERNAL_ID)).toBe(1);
    });
});
