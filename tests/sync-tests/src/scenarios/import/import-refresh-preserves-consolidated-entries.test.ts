import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionImportService, TransactionService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isNotEmptyString } from '@rnw-community/shared';

import { seed, TestLayer, testQueryService } from '../../harness';
import { snapshotTransactionState } from '../../harness/db/snapshot-transaction-state';
import { seedRefundedExpense } from '../../harness/seed/seed-refund-fixture';

import type { TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;
const MANUAL_DUPLICATE_OPERATED_AT_MS = new Date(2025, 10, 2, 10, 0, 0).getTime();

const buildRefreshEntry = (accountId: number, type: TransactionEntryTypeEnum, externalId: string | null) => ({
    accountId,
    type,
    amount: 0,
    categoryId: null,
    categorySource: CategorySourceEnum.USER,
    mccCategoryId: null,
    externalId,
    exchangeRate: 1,
    toIban: null
});

const buildRefreshInput = (
    transaction: TransactionEntityInterface,
    accountId: number,
    feeExternalId: string | null
): TransactionCreateInputInterface => ({
    amount: 0,
    title: transaction.title,
    comment: '',
    type: TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt: transaction.operatedAt,
    externalId: transaction.externalId,
    externalSource: ExternalSourceEnum.MONOBANK,
    updatedBy: null,
    fromAccountId: accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        buildRefreshEntry(accountId, TransactionEntryTypeEnum.CREDIT, transaction.externalId),
        ...(isNotEmptyString(feeExternalId) ? [buildRefreshEntry(accountId, TransactionEntryTypeEnum.FEE, feeExternalId)] : [])
    ]
});

const fetchLedgerBalances = (accountIds: readonly number[]) =>
    Effect.flatMap(AccountBalanceRepository, accountBalanceRepository =>
        Effect.map(accountBalanceRepository.getLedgerBalances([...accountIds]), balances =>
            accountIds.map(accountId => [accountId, balances.get(accountId) ?? 0])
        )
    );

const refreshImportedTransaction = (transaction: TransactionEntityInterface, accountId: number, feeExternalId: string | null) =>
    Effect.flatMap(TransactionImportService, transactionImportService =>
        Effect.map(
            transactionImportService.bulkUpsertPreparedImported(
                transactionImportService.prepareImportedInputs(
                    [buildRefreshInput(transaction, accountId, feeExternalId)],
                    new Map([[transaction.externalId ?? '', transaction.id]])
                )
            ),
            ({ transactions }) => transactions
        )
    );

const expectRefreshKeepsMovedEntriesAndUndo = Effect.fnUntraced(function* (input: {
    readonly accountIds: readonly number[];
    readonly canonical: TransactionEntityInterface;
    readonly canonicalAccountId: number;
    readonly consolidationType: TransactionConsolidationTypeEnum;
    readonly movedSourceIds: readonly number[];
    readonly feeExternalId?: string;
}) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const transactionService = yield* TransactionService;
    const sourceIds = [input.canonical.id, ...input.movedSourceIds];
    const stateBeforeConsolidation = yield* snapshotTransactionState(sourceIds);

    yield* transferConsolidationService.consolidate(null);

    expect((yield* testQueryService.findTransactionById(input.canonical.id)).consolidationType).toBe(input.consolidationType);

    const balancesAfterConsolidation = yield* fetchLedgerBalances(input.accountIds);
    const movedStateBeforeRefresh = yield* snapshotTransactionState(input.movedSourceIds);

    yield* refreshImportedTransaction(input.canonical, input.canonicalAccountId, input.feeExternalId ?? null);

    expect(yield* snapshotTransactionState(input.movedSourceIds)).toEqual(movedStateBeforeRefresh);
    expect(yield* fetchLedgerBalances(input.accountIds)).toEqual(balancesAfterConsolidation);

    yield* transactionService.unconsolidateById(input.canonical.id);

    expect(yield* snapshotTransactionState(sourceIds)).toEqual(stateBeforeConsolidation);
});

describe('import/import-refresh-preserves-consolidated-entries', () => {
    it.effect('keeps the manual duplicate moved under a synced expense when the synced expense is refreshed', () =>
        Effect.gen(function* () {
            const syncedAccount = yield* seed.account({ title: 'Privat card', type: AccountTypeEnum.BANK_SYNC, externalId: 'privat-card' });
            const manualAccount = yield* seed.account({ title: 'Privat manual', type: AccountTypeEnum.BANK });
            const category = yield* seed.category('Groceries');
            const tag = yield* seed.tag('Family');
            const pairs = yield* Effect.forEach([0, 1, 2], index =>
                Effect.gen(function* () {
                    const operatedAt = new Date(MANUAL_DUPLICATE_OPERATED_AT_MS + index * 7 * DAY_MS);
                    const amount = (100 + index) * PRECISION;
                    const synced = yield* seed.bankPairExpense(
                        { externalId: `refresh-synced-${index}`, operatedAt },
                        { accountId: syncedAccount.id, amount }
                    );
                    const manual = yield* seed.manualExpense({
                        accountId: manualAccount.id,
                        amount,
                        operatedAt,
                        categoryId: category.id,
                        comment: `Manual note ${index}`
                    });

                    yield* seed.transactionTag(manual.id, tag.id);

                    return { synced, manual };
                })
            );
            const [{ synced, manual }] = pairs;

            yield* expectRefreshKeepsMovedEntriesAndUndo({
                accountIds: [syncedAccount.id, manualAccount.id],
                canonical: synced,
                canonicalAccountId: syncedAccount.id,
                consolidationType: TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE,
                movedSourceIds: [manual.id]
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the refund income moved under a refunded expense when the expense is refreshed', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalId: 'mono-card' });
            const { expense, refunds } = yield* seedRefundedExpense({
                accountId: account.id,
                expenseAmount: 120 * PRECISION,
                refundAmounts: [40 * PRECISION],
                externalIdPrefix: 'refresh-refund'
            });

            yield* expectRefreshKeepsMovedEntriesAndUndo({
                accountIds: [account.id],
                canonical: expense,
                canonicalAccountId: account.id,
                consolidationType: TransactionConsolidationTypeEnum.REFUND,
                movedSourceIds: refunds.map(refund => refund.id)
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps both refund incomes moved under a payment and fee refunded separately when the expense is refreshed', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalId: 'privat-card' });
            const { expense, refunds } = yield* seed.refundedExpense({
                accountId: account.id,
                expenseAmount: 120 * PRECISION,
                expenseFeeAmount: 3 * PRECISION,
                refundAmounts: [120 * PRECISION, 3 * PRECISION],
                refundDelaySeconds: 60,
                externalIdPrefix: 'refresh-fee-refund'
            });

            yield* expectRefreshKeepsMovedEntriesAndUndo({
                accountIds: [account.id],
                canonical: expense,
                canonicalAccountId: account.id,
                consolidationType: TransactionConsolidationTypeEnum.REFUND,
                movedSourceIds: refunds.map(refund => refund.id),
                feeExternalId: 'refresh-fee-refund-expense-fee'
            });
            expect(yield* fetchLedgerBalances([account.id])).toEqual([[account.id, 0]]);
        }).pipe(Effect.provide(TestLayer))
    );
});
