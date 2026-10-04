import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { expectConsolidationParent, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { fetchTotalExpense } from '../harness/fetch-total-expense';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const AMOUNT = 200 * PRECISION;
const TRANSFER_OPERATED_AT = new Date('2023-11-26T13:52:27');
const HOUR_MS = 60 * 60 * 1000;
const ERSTE_GAP_MS = 6.3 * HOUR_MS;
const ARCHIVED_AT = new Date('2026-01-01');

const seedOneSidedTransfer = (targetType: AccountTypeEnum, isSourceMissing = true, isSourceInactiveOnly = false) =>
    Effect.gen(function* () {
        const archivedAccount = yield* testSeedService.account({ title: 'erste bank EUR', type: AccountTypeEnum.BANK });
        const liveAccount = yield* testSeedService.account({ title: 'Готівка EUR', type: targetType });
        const transfer = yield* testSeedService.directTransfer({
            exchangeRate: 1,
            operatedAt: TRANSFER_OPERATED_AT,
            sourceAccountId: isSourceMissing ? archivedAccount.id : liveAccount.id,
            sourceAmount: AMOUNT,
            sourceEntryExchangeRate: 1,
            targetAccountId: isSourceMissing ? liveAccount.id : archivedAccount.id,
            targetAmount: AMOUNT,
            title: '',
            toIban: null
        });

        yield* testSeedService.updateTransaction(transfer.id, { externalSource: ExternalSourceEnum.CSV });
        if (isSourceInactiveOnly) {
            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, archivedAccount.id));

            return { liveAccount, transfer };
        }

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: ARCHIVED_AT })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, transfer.id),
                    eq(TransactionEntryEntityTable.accountId, archivedAccount.id)
                )
            );
        yield* testDb.update(AccountEntityTable).set({ deletedAt: ARCHIVED_AT }).where(eq(AccountEntityTable.id, archivedAccount.id));

        return { liveAccount, transfer };
    });

const seedSyncedExpense = (
    accountId: number,
    externalSource: ExternalSourceEnum,
    gapMs: number,
    amount: number = AMOUNT,
    mcc: string | null = null
) =>
    Effect.gen(function* () {
        const mccCategoryId = isDefined(mcc) ? (yield* testQueryService.findMccByCode(mcc)).id : null;
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: `synced-${accountId}-${gapMs}-${amount}`, operatedAt: new Date(TRANSFER_OPERATED_AT.getTime() - gapMs) },
            { accountId, amount, mccCategoryId }
        );

        return yield* testSeedService.updateTransaction(expense.id, { externalSource, title: 'AUTOMAT 12210014' });
    });

const expectLeftUnconsolidated = (transactionIds: number[]) =>
    Effect.gen(function* () {
        expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });

        for (const transactionId of transactionIds) {
            expect((yield* testQueryService.fetchTransactionById(transactionId)).consolidationParentTransactionId).toBeNull();
        }
    });

const expectMergedIntoTransfer = (input: {
    readonly transferId: number;
    readonly expenseId: number;
    readonly syncedAccountId: number;
    readonly liveAccountId: number;
}) =>
    Effect.gen(function* () {
        const snapshotMoney = Effect.all({
            ledger: fetchLedgerBalances([input.syncedAccountId, input.liveAccountId]),
            expense: fetchTotalExpense()
        });
        const before = yield* snapshotMoney;
        const result = yield* runConsolidation();
        const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expect(result).toEqual({ consolidated: 1, found: 1 });
        expect(canonicals.map(({ fromAccountId, toAccountId }) => [fromAccountId, toAccountId])).toEqual([
            [input.syncedAccountId, input.liveAccountId]
        ]);
        yield* expectConsolidationParent(input.transferId, canonicals[0].id);
        yield* expectConsolidationParent(input.expenseId, canonicals[0].id);
        expect(yield* snapshotMoney).toEqual({ ledger: before.ledger, expense: before.expense - AMOUNT });
        yield* expectSecondConsolidationRunStable();
    });

layer(TestLayer)('consolidation/existing-transfer-archived-source-expense-duplicate', it => {
    it.effect.each([
        ['from an archived account', false],
        ['from an inactive account whose entry is still live', true]
    ] as const)('merges an Erste expense without MCC 6.3h before a cash transfer %s', ([, isSourceInactiveOnly]) =>
        Effect.gen(function* () {
            const { liveAccount, transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.CASH, true, isSourceInactiveOnly);
            const ersteAccount = yield* testSeedService.bankSyncAccount('Erste EUR', ExternalSourceEnum.ERSTE, null);
            const expense = yield* seedSyncedExpense(ersteAccount.id, ExternalSourceEnum.ERSTE, ERSTE_GAP_MS);

            yield* expectMergedIntoTransfer({
                transferId: transfer.id,
                expenseId: expense.id,
                syncedAccountId: ersteAccount.id,
                liveAccountId: liveAccount.id
            });
        })
    );

    it.effect('merges a Monobank transfer-MCC expense 5h away from a transfer out of an archived account', () =>
        Effect.gen(function* () {
            const { liveAccount, transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.BANK);
            const monobankAccount = yield* testSeedService.bankSyncAccount('Monobank Black', ExternalSourceEnum.MONOBANK, null);
            const expense = yield* seedSyncedExpense(monobankAccount.id, ExternalSourceEnum.MONOBANK, 5 * HOUR_MS, AMOUNT, '4829');

            yield* expectMergedIntoTransfer({
                transferId: transfer.id,
                expenseId: expense.id,
                syncedAccountId: monobankAccount.id,
                liveAccountId: liveAccount.id
            });
        })
    );

    it.effect('keeps an Erste expense when the surviving transfer side is not a cash account', () =>
        Effect.gen(function* () {
            const { transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.BANK);
            const ersteAccount = yield* testSeedService.bankSyncAccount('Erste EUR', ExternalSourceEnum.ERSTE, null);
            const expense = yield* seedSyncedExpense(ersteAccount.id, ExternalSourceEnum.ERSTE, ERSTE_GAP_MS);

            yield* expectLeftUnconsolidated([transfer.id, expense.id]);
        })
    );

    it.effect.each([
        ['the amount is off by the smallest unit', AMOUNT + 1, ERSTE_GAP_MS],
        ['the expense is more than 7h away', AMOUNT, 7 * HOUR_MS + 1000]
    ] as const)('keeps an Erste expense when %s', ([, amount, gapMs]) =>
        Effect.gen(function* () {
            const { transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.CASH);
            const ersteAccount = yield* testSeedService.bankSyncAccount('Erste EUR', ExternalSourceEnum.ERSTE, null);
            const expense = yield* seedSyncedExpense(ersteAccount.id, ExternalSourceEnum.ERSTE, gapMs, amount);

            yield* expectLeftUnconsolidated([transfer.id, expense.id]);
        })
    );

    it.effect('keeps both Erste expenses when two of them could duplicate the transfer', () =>
        Effect.gen(function* () {
            const { transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.CASH);
            const ersteAccount = yield* testSeedService.bankSyncAccount('Erste EUR', ExternalSourceEnum.ERSTE, null);
            const firstExpense = yield* seedSyncedExpense(ersteAccount.id, ExternalSourceEnum.ERSTE, ERSTE_GAP_MS);
            const secondExpense = yield* seedSyncedExpense(ersteAccount.id, ExternalSourceEnum.ERSTE, HOUR_MS);

            yield* expectLeftUnconsolidated([transfer.id, firstExpense.id, secondExpense.id]);
        })
    );

    it.effect('keeps a synced income when the missing side of the transfer is its archived target', () =>
        Effect.gen(function* () {
            const { transfer } = yield* seedOneSidedTransfer(AccountTypeEnum.CASH, false);
            const ersteAccount = yield* testSeedService.bankSyncAccount('Erste EUR', ExternalSourceEnum.ERSTE, null);
            const income = yield* testSeedService.bankPairIncome(
                { externalId: 'synced-rent', operatedAt: new Date(TRANSFER_OPERATED_AT.getTime() + HOUR_MS) },
                { accountId: ersteAccount.id, amount: AMOUNT }
            );

            yield* testSeedService.updateTransaction(income.id, { externalSource: ExternalSourceEnum.ERSTE });

            yield* expectLeftUnconsolidated([transfer.id, income.id]);
        })
    );
});
