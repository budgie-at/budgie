import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { TransactionImportService } from '@budgie/ledger';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, SyncTransactionTypeEnum, ersteMapper } from '@budgie/sync';
import { beforeEach, describe, expect, it, vi } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Latch from 'effect/Latch';
import * as Ref from 'effect/Ref';

import { isDefined } from '@rnw-community/shared';

import { expectFileImportConsolidationEnqueued, makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';
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

const buildStubErsteFileClient = (transactions: SyncTransactionInterface[] = [buildErsteTransaction()]): FileBasedSyncClientInterface => ({
    getAccounts: () => [buildErsteBankAccount()],
    getTransactions: () => transactions
});

const FALLBACK_RELEASE_MS = 25;

const buildTwoCallBarrier = Effect.fnUntraced(function* () {
    const latch = yield* Latch.make();
    const callCount = yield* Ref.make(0);

    return {
        wait: Effect.gen(function* () {
            const calls = yield* Ref.updateAndGet(callCount, count => count + 1);

            if (calls === 2) {
                yield* latch.open;

                return;
            }

            yield* Effect.race(latch.await, Effect.sleep(FALLBACK_RELEASE_MS));
            yield* latch.open;
        })
    };
});

type TwoCallBarrier = Effect.Success<ReturnType<typeof buildTwoCallBarrier>>;

const buildErsteSyncService = (client: FileBasedSyncClientInterface = buildStubErsteFileClient()) =>
    makeStubFileBankSyncService(ExternalSourceEnum.ERSTE, client);

const buildBarrierErsteSyncService = (parseBarrier: TwoCallBarrier, resolveBarrier: TwoCallBarrier) => {
    const client = buildStubErsteFileClient();

    return makeStubFileBankSyncService(ExternalSourceEnum.ERSTE, client, new Map(), {
        parseFile: () => parseBarrier.wait.pipe(Effect.as({ client, bankAccounts: client.getAccounts() })),
        resolveMccCategoryIdMap: () => resolveBarrier.wait.pipe(Effect.as(new Map()))
    });
};

const fetchImportedErsteTransactionCount = () =>
    Effect.gen(function* () {
        return (yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE),
                    eq(TransactionEntityTable.externalId, ERSTE_EXTERNAL_ID)
                )
            )).length;
    });

const fetchImportedErsteTransactions = () =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE));
    });

describe('erste/file-import-idempotency', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.effect('enqueues consolidation after an Erste file import introduces new transactions', () =>
        Effect.gen(function* () {
            const syncService = yield* buildErsteSyncService();

            yield* syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

            const [transaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.externalSource, ExternalSourceEnum.ERSTE),
                        eq(TransactionEntityTable.externalId, ERSTE_EXTERNAL_ID)
                    )
                );

            yield* expectFileImportConsolidationEnqueued(transaction?.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps one transaction when the same statement import starts twice', () =>
        Effect.gen(function* () {
            const parseBarrier = yield* buildTwoCallBarrier();
            const resolveBarrier = yield* buildTwoCallBarrier();
            const firstSyncService = yield* buildBarrierErsteSyncService(parseBarrier, resolveBarrier);
            const secondSyncService = yield* buildBarrierErsteSyncService(parseBarrier, resolveBarrier);

            yield* Effect.all(
                [
                    firstSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]),
                    secondSyncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID])
                ],
                { concurrency: 'unbounded' }
            );

            expect(yield* fetchImportedErsteTransactionCount()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps one transaction when the same statement is re-imported later', () =>
        Effect.gen(function* () {
            const syncService = yield* buildErsteSyncService();

            yield* syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);
            yield* syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

            expect(yield* fetchImportedErsteTransactionCount()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updates an older Erste PDF transaction instead of creating a duplicate', () =>
        Effect.gen(function* () {
            const transactionImportService = yield* TransactionImportService;
            const account = yield* seed.account({ externalId: ERSTE_ACCOUNT_ID, externalSource: ExternalSourceEnum.ERSTE });
            const bankTransaction = buildMappedErsteTransaction();
            const [legacyTransaction] = yield* transactionImportService.bulkUpsertImported(
                [buildLegacyErsteInput(bankTransaction, account.id, ERSTE_INSTANT_REFERENCE_DETAILS_EXTERNAL_ID)],
                new Map()
            );
            if (!isDefined(legacyTransaction)) {
                return yield* Effect.die(new Error('Expected legacy Erste transaction to be inserted'));
            }
            const syncService = yield* buildErsteSyncService(buildStubErsteFileClient([bankTransaction]));

            yield* syncService.executeImportForSelectedAccounts(ERSTE_STATEMENT_URI, [ERSTE_ACCOUNT_ID]);

            const transactions = yield* fetchImportedErsteTransactions();

            expect(transactions).toHaveLength(1);
            expect(transactions[0].id).toBe(legacyTransaction.id);
            expect(transactions[0].externalId).toBe(bankTransaction.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
