import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import {
    BANK_FEE_CATEGORY_ID,
    CategoryEntityTable,
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import {
    SyncAccountBalanceStateEnum,
    SyncAccountTypeEnum,
    SyncProviderEnum,
    SyncTransactionTypeEnum,
    TransferConsolidationService
} from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, fetchTransactionById, makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const CARD_ID = 'privat-heal-card';
const STATEMENT_URI = 'privatbank-heal.xlsx';
const EXPENSE_TIME = 1_768_302_000;
const REFUND_DELAY_SECONDS = 3600;
const MERCHANT = 'HEAL TEST SHOP';
const EXPENSE_AMOUNT = 500;
const CHANGED_AMOUNT = 600;
const USER_AMOUNT = 450;

const buildCard = (): SyncAccountInterface => ({
    id: CARD_ID,
    provider: SyncProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD
});

const buildRow = (id: string, type: SyncTransactionTypeEnum, amount: number, time: number): SyncTransactionInterface => ({
    id,
    provider: SyncProviderEnum.PRIVATBANK,
    accountId: CARD_ID,
    type,
    time,
    description: MERCHANT,
    comment: '',
    mcc: 0,
    originalMcc: 0,
    amount,
    operationAmount: amount,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    category: '',
    feeAmount: 0
});

const buildExpenseRow = (amount = EXPENSE_AMOUNT) => buildRow('heal-expense', SyncTransactionTypeEnum.EXPENSE, amount, EXPENSE_TIME);

const buildRefundRow = () => buildRow('heal-refund', SyncTransactionTypeEnum.INCOME, EXPENSE_AMOUNT, EXPENSE_TIME + REFUND_DELAY_SECONDS);

class StatementClient implements FileBasedSyncClientInterface {
    constructor(private readonly rows: SyncTransactionInterface[]) {}

    getAccounts(): SyncAccountInterface[] {
        return [buildCard()];
    }

    getTransactions(): SyncTransactionInterface[] {
        return this.rows;
    }
}

const importStatement = (rows: SyncTransactionInterface[]) =>
    Effect.gen(function* () {
        const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new StatementClient(rows));

        return yield* syncService.executeImportForSelectedAccounts(STATEMENT_URI, [CARD_ID]);
    });

const seedCard = () => seed.account({ title: 'Heal Card', externalId: CARD_ID, externalSource: ExternalSourceEnum.PRIVATBANK });

const findTransactionId = (externalId: string) =>
    Effect.gen(function* () {
        const [transaction] = yield* testDb
            .select({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, externalId));

        return transaction.id;
    });

const fetchLiveEntries = (transactionId: number) =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(
            and(
                or(
                    eq(TransactionEntryEntityTable.transactionId, transactionId),
                    eq(TransactionEntryEntityTable.originalTransactionId, transactionId)
                ),
                isNull(TransactionEntryEntityTable.deletedAt)
            )
        );

const deleteEntriesOf = (transactionId: number) =>
    testDb
        .delete(TransactionEntryEntityTable)
        .where(
            or(
                eq(TransactionEntryEntityTable.transactionId, transactionId),
                eq(TransactionEntryEntityTable.originalTransactionId, transactionId)
            )
        );

const setEntryAmount = (transactionId: number, amount: number) =>
    testDb
        .update(TransactionEntryEntityTable)
        .set({ amount: amount * PRECISION })
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId));

const importConsolidatedRefund = () =>
    Effect.gen(function* () {
        const transferConsolidationService = yield* TransferConsolidationService;
        const account = yield* seedCard();

        yield* importStatement([buildExpenseRow(), buildRefundRow()]);
        yield* transferConsolidationService.consolidate(null);

        const expenseId = yield* findTransactionId('heal-expense');
        const refundId = yield* findTransactionId('heal-refund');

        expect((yield* fetchTransactionById(refundId)).consolidationParentTransactionId).toBe(expenseId);
        expect((yield* fetchTransactionById(expenseId)).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        return { account, expenseId, refundId };
    });

describe('import/file-reimport-heal', () => {
    it.effect('refills a re-imported transaction that lost all of its entries', () =>
        Effect.gen(function* () {
            const account = yield* seedCard();
            yield* importStatement([buildExpenseRow()]);
            const expenseId = yield* findTransactionId('heal-expense');
            const balance = yield* fetchAccountBalance(account.id);
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const enqueue = vi.mocked(transferConsolidationDrainerService.enqueue);

            yield* deleteEntriesOf(expenseId);
            enqueue.mockClear();
            yield* importStatement([buildExpenseRow()]);

            expect((yield* fetchLiveEntries(expenseId)).map(entry => entry.amount)).toEqual([EXPENSE_AMOUNT * PRECISION]);
            expect(yield* fetchAccountBalance(account.id)).toBe(balance);
            expect(enqueue).toHaveBeenCalledWith(expect.objectContaining({ transactionIds: [expenseId] }));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('restores an emptied refund and consolidates it with its expense again', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { account, expenseId, refundId } = yield* importConsolidatedRefund();
            const balance = yield* fetchAccountBalance(account.id);

            yield* deleteEntriesOf(refundId);
            yield* importStatement([buildExpenseRow(), buildRefundRow()]);

            expect((yield* fetchTransactionById(refundId)).consolidationParentTransactionId).toBeNull();
            expect((yield* fetchTransactionById(expenseId)).consolidationType).toBeNull();
            expect(yield* fetchAccountBalance(account.id)).toBe(balance);

            yield* transferConsolidationService.consolidate(null);

            const movedEntries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.originalTransactionId, refundId));

            expect((yield* fetchTransactionById(refundId)).consolidationParentTransactionId).toBe(expenseId);
            expect((yield* fetchTransactionById(expenseId)).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect(movedEntries.map(entry => [entry.transactionId, entry.amount])).toEqual([[expenseId, EXPENSE_AMOUNT * PRECISION]]);
            expect(yield* fetchAccountBalance(account.id)).toBe(balance);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('applies a bank-changed amount and keeps the user category', () =>
        Effect.gen(function* () {
            const account = yield* seedCard();
            const [category] = yield* testDb
                .select({ id: CategoryEntityTable.id })
                .from(CategoryEntityTable)
                .where(ne(CategoryEntityTable.id, BANK_FEE_CATEGORY_ID))
                .limit(1);
            yield* importStatement([buildExpenseRow()]);
            const expenseId = yield* findTransactionId('heal-expense');
            const fingerprint = (yield* fetchTransactionById(expenseId)).importFingerprint;
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ categoryId: category.id })
                .where(eq(TransactionEntryEntityTable.transactionId, expenseId));

            yield* importStatement([buildExpenseRow(CHANGED_AMOUNT)]);

            const [entry] = yield* fetchLiveEntries(expenseId);

            expect(entry.amount).toBe(CHANGED_AMOUNT * PRECISION);
            expect(entry.categoryId).toBe(category.id);
            expect((yield* fetchTransactionById(expenseId)).importFingerprint).not.toBe(fingerprint);
            expect(yield* fetchAccountBalance(account.id)).toBe(-CHANGED_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a user-edited amount when the bank row is unchanged', () =>
        Effect.gen(function* () {
            const account = yield* seedCard();
            yield* importStatement([buildExpenseRow()]);
            const expenseId = yield* findTransactionId('heal-expense');
            yield* setEntryAmount(expenseId, USER_AMOUNT);

            yield* importStatement([buildExpenseRow()]);

            expect((yield* fetchLiveEntries(expenseId)).map(entry => entry.amount)).toEqual([USER_AMOUNT * PRECISION]);
            expect(yield* fetchAccountBalance(account.id)).toBe(-USER_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores a fingerprint on a legacy row without changing its amount', () =>
        Effect.gen(function* () {
            yield* seedCard();
            yield* importStatement([buildExpenseRow()]);
            const expenseId = yield* findTransactionId('heal-expense');
            yield* testDb.update(TransactionEntityTable).set({ importFingerprint: null }).where(eq(TransactionEntityTable.id, expenseId));
            yield* setEntryAmount(expenseId, USER_AMOUNT);

            yield* importStatement([buildExpenseRow(CHANGED_AMOUNT)]);

            expect((yield* fetchLiveEntries(expenseId)).map(entry => entry.amount)).toEqual([USER_AMOUNT * PRECISION]);
            expect((yield* fetchTransactionById(expenseId)).importFingerprint).toEqual(expect.any(String));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not rewrite a bank-changed amount on a consolidated row', () =>
        Effect.gen(function* () {
            const { expenseId, refundId } = yield* importConsolidatedRefund();
            const fingerprint = (yield* fetchTransactionById(expenseId)).importFingerprint;

            yield* importStatement([buildExpenseRow(CHANGED_AMOUNT), buildRefundRow()]);

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, expenseId));

            expect(entries.map(entry => entry.amount)).toEqual([EXPENSE_AMOUNT * PRECISION, EXPENSE_AMOUNT * PRECISION]);
            expect((yield* fetchTransactionById(expenseId)).importFingerprint).toBe(fingerprint);
            expect((yield* fetchTransactionById(refundId)).consolidationParentTransactionId).toBe(expenseId);
        }).pipe(Effect.provide(TestLayer))
    );
});
