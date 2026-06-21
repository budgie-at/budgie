import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BankAccountTypeEnum, BankProviderEnum, BankTransactionTypeEnum, ersteMapper } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { expectFileImportConsolidationEnqueued, seed, StubFileBankSyncService, testDb } from '../../harness';

import { BaseFileBankSyncService } from '@app/sync/service/base-file-bank-sync.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { transactionImportService } from '@app/transaction/service/transaction-import.service';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { ParsedFileResultInterface } from '@app/sync/interface/parsed-file-result.interface';
import type { BankAccountInterface, BankTransactionInterface, ErsteRowInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

const ERSTE_ACCOUNT_ID = 'AT123';
const ERSTE_EXTERNAL_ID = 'erste-transaction-1';
const ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID = 'd7bc0c964d4e918ed257dacef404ce32';
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

const buildErsteTransaction = (): BankTransactionInterface => ({
    id: ERSTE_EXTERNAL_ID,
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

const buildErsteRow = (): ErsteRowInterface => ({
    date: new Date('2026-01-13T11:00:00.000Z'),
    reference: 'ERSTE CARD PAYMENT',
    description: 'ERSTE CARD PAYMENT',
    details: 'Parsed card location',
    amount: -42.5,
    isCredit: false,
    city: 'WIEN',
    countryAlpha2: 'AT'
});

const buildMappedErsteTransaction = (): BankTransactionInterface => ersteMapper.mapTransaction(buildErsteRow(), ERSTE_ACCOUNT_ID);

const buildLegacyErsteInput = (
    bankTransaction: BankTransactionInterface,
    accountId: number,
    externalId: string
): TransactionCreateInputInterface => {
    const input = mapBankTransactionToCreateInput(bankTransaction, accountId, null, ExternalSourceEnum.ERSTE);

    return {
        ...input,
        externalId,
        entries: input.entries.map(entry => ({
            ...entry,
            externalId: entry.externalId === bankTransaction.id ? externalId : entry.externalId
        }))
    };
};

class StubErsteFileClient implements FileBasedBankSyncClientInterface {
    constructor(private readonly transactions: BankTransactionInterface[] = [buildErsteTransaction()]) {}

    getAccounts(): BankAccountInterface[] {
        return [buildErsteBankAccount()];
    }

    getTransactions(): BankTransactionInterface[] {
        return this.transactions;
    }
}

class TwoCallBarrier {
    private static readonly FALLBACK_RELEASE_MS = 25;

    private pendingResolvers: Array<() => void> = [];
    private timer: ReturnType<typeof setTimeout> | null = null;

    async wait(): Promise<void> {
        return new Promise(resolve => {
            this.pendingResolvers.push(resolve);

            if (this.pendingResolvers.length === 2) {
                this.release();
            }

            if (this.pendingResolvers.length === 1) {
                this.timer = setTimeout(() => {
                    this.release();
                }, TwoCallBarrier.FALLBACK_RELEASE_MS);
            }
        });
    }

    private release(): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        const resolvers = this.pendingResolvers;
        this.pendingResolvers = [];
        resolvers.forEach(resolve => {
            resolve();
        });
    }
}

class BarrierErsteSyncService extends BaseFileBankSyncService {
    constructor(
        private readonly parseBarrier: TwoCallBarrier,
        private readonly resolveBarrier: TwoCallBarrier,
        private readonly client: FileBasedBankSyncClientInterface
    ) {
        super(ExternalSourceEnum.ERSTE);
    }

    protected override async parseFile(): Promise<ParsedFileResultInterface> {
        await this.parseBarrier.wait();

        return { client: this.client, bankAccounts: this.client.getAccounts() };
    }

    protected override async resolveMccCategoryIdMap(): Promise<Map<string, MccCategoryLookupInterface | null>> {
        await this.resolveBarrier.wait();

        return new Map();
    }
}

const buildErsteSyncService = (client: FileBasedBankSyncClientInterface = new StubErsteFileClient()): StubFileBankSyncService =>
    new StubFileBankSyncService(ExternalSourceEnum.ERSTE, client);

const buildBarrierErsteSyncService = (parseBarrier: TwoCallBarrier, resolveBarrier: TwoCallBarrier): BarrierErsteSyncService =>
    new BarrierErsteSyncService(parseBarrier, resolveBarrier, new StubErsteFileClient());

const fetchImportedErsteTransactionCount = (): number =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(
            and(
                eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE),
                eq(TransactionEntityTable.externalId, ERSTE_EXTERNAL_ID)
            )
        )
        .all().length;

const fetchImportedErsteTransactions = (): TransactionEntityInterface[] =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE)).all();

describe('erste/file-import-idempotency', () => {
    beforeEach(() => {
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
    });

    it('enqueues consolidation after an Erste file import introduces new transactions', async () => {
        const syncService = buildErsteSyncService();

        await syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        const transaction = testDb
            .select()
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE),
                    eq(TransactionEntityTable.externalId, ERSTE_EXTERNAL_ID)
                )
            )
            .get();

        expectFileImportConsolidationEnqueued(transaction?.id);
    });

    it('keeps one transaction when the same statement import starts twice', async () => {
        const parseBarrier = new TwoCallBarrier();
        const resolveBarrier = new TwoCallBarrier();
        const firstSyncService = buildBarrierErsteSyncService(parseBarrier, resolveBarrier);
        const secondSyncService = buildBarrierErsteSyncService(parseBarrier, resolveBarrier);

        await Promise.all([
            firstSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]),
            secondSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID])
        ]);

        expect(fetchImportedErsteTransactionCount()).toBe(1);
    });

    it('keeps one transaction when the same statement is re-imported later', async () => {
        const syncService = buildErsteSyncService();

        await syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);
        await syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        expect(fetchImportedErsteTransactionCount()).toBe(1);
    });

    it('updates an older Erste PDF transaction instead of creating a duplicate', async () => {
        const account = seed.account({ externalId: ERSTE_ACCOUNT_ID, externalSource: ExternalSourceEnum.ERSTE });
        const bankTransaction = buildMappedErsteTransaction();
        const [legacyTransaction] = await transactionImportService.bulkUpsertImported(
            [buildLegacyErsteInput(bankTransaction, account.id, ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID)],
            new Map()
        );
        if (!isDefined(legacyTransaction)) {
            throw new Error('Expected legacy Erste transaction to be inserted');
        }
        const syncService = buildErsteSyncService(new StubErsteFileClient([bankTransaction]));

        await syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        const transactions = fetchImportedErsteTransactions();

        expect(transactions).toHaveLength(1);
        expect(transactions[0].id).toBe(legacyTransaction.id);
        expect(transactions[0].externalId).toBe(bankTransaction.id);
    });
});
