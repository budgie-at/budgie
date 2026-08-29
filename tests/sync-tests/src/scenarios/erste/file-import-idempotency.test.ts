import { AbstractFileSyncService } from '@app/sync/service/abstract-file-sync.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { transactionImportService } from '@app/transaction/service/transaction-import.service';
import { AccountTypeEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, SyncTransactionTypeEnum, ersteMapper } from '@budgie/sync';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { StubFileBankSyncService, expectFileImportConsolidationEnqueued, seed, testDb } from '../../harness';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { ParsedFileResultInterface } from '@app/sync/interface/parsed-file-result.interface';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { ErsteRowInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const ERSTE_ACCOUNT_ID = 'AT123';
const ERSTE_EXTERNAL_ID = 'erste-transaction-1';
const ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID = 'd7bc0c964d4e918ed257dacef404ce32';
const ERSTE_STATEMENT_URI = 'erste-statement.pdf';

const buildErsteBankAccount = (): SyncAccountInterface => ({
    id: ERSTE_ACCOUNT_ID,
    provider: SyncProviderEnum.ERSTE,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CHECKING,
    iban: ERSTE_ACCOUNT_ID
});

const buildErsteTransaction = (): SyncTransactionInterface => ({
    id: ERSTE_EXTERNAL_ID,
    provider: SyncProviderEnum.ERSTE,
    accountId: ERSTE_ACCOUNT_ID,
    type: SyncTransactionTypeEnum.EXPENSE,
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

const buildMappedErsteTransaction = (): SyncTransactionInterface => ersteMapper.mapTransaction(buildErsteRow(), ERSTE_ACCOUNT_ID);

const buildLegacyErsteInput = (
    bankTransaction: SyncTransactionInterface,
    accountId: number,
    externalId: string
): TransactionCreateInputInterface => {
    const input = mapBankTransactionToCreateInput(bankTransaction, accountId, null);

    return {
        ...input,
        externalId,
        entries: input.entries.map(entry => ({
            ...entry,
            externalId: entry.externalId === bankTransaction.id ? externalId : entry.externalId
        }))
    };
};

const buildStubErsteFileClient = (transactions: SyncTransactionInterface[] = [buildErsteTransaction()]): FileBasedSyncClientInterface => ({
    getAccounts: () => [buildErsteBankAccount()],
    getTransactions: () => transactions
});

const buildTwoCallBarrier = () => {
    const fallbackReleaseMs = 25;
    let pendingResolvers: Array<() => void> = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const release = (): void => {
        if (isDefined(timer)) {
            clearTimeout(timer);
            timer = null;
        }

        const resolvers = pendingResolvers;
        pendingResolvers = [];
        resolvers.forEach(resolve => {
            resolve();
        });
    };

    return {
        wait: (): Promise<void> =>
            new Promise(resolve => {
                pendingResolvers.push(resolve);

                if (pendingResolvers.length === 2) {
                    release();
                }

                if (pendingResolvers.length === 1) {
                    timer = setTimeout(() => {
                        release();
                    }, fallbackReleaseMs);
                }
            })
    };
};

class BarrierErsteSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.ERSTE;
    protected readonly providerTitle = 'Erste';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    constructor(
        private readonly parseBarrier: ReturnType<typeof buildTwoCallBarrier>,
        private readonly resolveBarrier: ReturnType<typeof buildTwoCallBarrier>,
        private readonly client: FileBasedSyncClientInterface
    ) {
        super();
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

const buildErsteSyncService = (client: FileBasedSyncClientInterface = buildStubErsteFileClient()): StubFileBankSyncService =>
    new StubFileBankSyncService(ExternalSourceEnum.ERSTE, client);

const buildBarrierErsteSyncService = (
    parseBarrier: ReturnType<typeof buildTwoCallBarrier>,
    resolveBarrier: ReturnType<typeof buildTwoCallBarrier>
): BarrierErsteSyncService => new BarrierErsteSyncService(parseBarrier, resolveBarrier, buildStubErsteFileClient());

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
        vi.clearAllMocks();
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
        const parseBarrier = buildTwoCallBarrier();
        const resolveBarrier = buildTwoCallBarrier();
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
        const syncService = buildErsteSyncService(buildStubErsteFileClient([bankTransaction]));

        await syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

        const transactions = fetchImportedErsteTransactions();

        expect(transactions).toHaveLength(1);
        expect(transactions[0].id).toBe(legacyTransaction.id);
        expect(transactions[0].externalId).toBe(bankTransaction.id);
    });
});
