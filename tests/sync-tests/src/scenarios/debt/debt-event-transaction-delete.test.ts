import { AccountTypeEnum, Db, DebtEventEntityTable, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    TransactionDebtSettlementService,
    TransactionService
} from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    fetchAccountBalance,
    monobankStub,
    MonobankSyncService,
    seed,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';

const syncAttachedDebtReturn = Effect.gen(function* () {
    const monobankSyncService = yield* MonobankSyncService;
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
    yield* setupMonobankFixture();
    const debtAccount = yield* seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance: 300 * PRECISION });
    yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([debtAccount.id]);
    const debtBalanceBefore = yield* fetchAccountBalance(debtAccount.id);

    monobankStub.statement([buildMonobank.transaction({ id: 'tx-debt-return', amount: 10_000, hold: false })]);
    yield* monobankSyncService.sync();
    const [transaction] = yield* testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalId, 'tx-debt-return'));
    yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

    return { debtAccount, debtBalanceBefore, transaction };
});

const manualAttachedDebtIncome = Effect.gen(function* () {
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
    const cashAccount = yield* seed.account({ title: 'Cash' });
    const debtAccount = yield* seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance: 300 * PRECISION });
    yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([cashAccount.id, debtAccount.id]);
    const debtBalanceBefore = yield* fetchAccountBalance(debtAccount.id);
    const transaction = yield* seed.manualExpense({
        accountId: cashAccount.id,
        amount: 100 * PRECISION,
        operatedAt: new Date(),
        type: TransactionTypeEnum.INCOME
    });
    yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

    return { debtAccount, debtBalanceBefore, transaction };
});

const fetchDebtEvents = (transactionId: number) =>
    testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId));

const itRestoresDebtBalance = (
    name: string,
    setup: typeof manualAttachedDebtIncome | typeof syncAttachedDebtReturn,
    remove: (
        attached: Effect.Success<typeof syncAttachedDebtReturn>
    ) => Effect.Effect<unknown, unknown, AccountArchiveService | Db | TransactionService>
) => {
    it.effect(name, () =>
        Effect.gen(function* () {
            const attached = yield* setup;
            const { debtAccount, debtBalanceBefore, transaction } = attached;
            expect(yield* fetchDebtEvents(transaction.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(debtAccount.id)).not.toStrictEqual(debtBalanceBefore);

            yield* remove(attached);

            expect(yield* fetchDebtEvents(transaction.id)).toHaveLength(0);
            expect(yield* fetchAccountBalance(debtAccount.id)).toStrictEqual(debtBalanceBefore);
        }).pipe(Effect.provide(TestLayer))
    );
};

describe('debt/debt-event-transaction-delete', () => {
    itRestoresDebtBalance(
        'restores the debt balance when the user deletes a synced transaction',
        syncAttachedDebtReturn,
        ({ transaction }) => Effect.flatMap(TransactionService, transactionService => transactionService.deleteById(transaction.id))
    );

    itRestoresDebtBalance(
        'restores the debt balance when the user deletes a manual transaction',
        manualAttachedDebtIncome,
        ({ transaction }) => Effect.flatMap(TransactionService, transactionService => transactionService.deleteById(transaction.id))
    );

    itRestoresDebtBalance('restores the debt balance when a synced transaction is purged', syncAttachedDebtReturn, ({ transaction }) =>
        Effect.flatMap(TransactionService, transactionService => transactionService.purgeById(transaction.id))
    );

    itRestoresDebtBalance(
        'restores the debt balance of an archived debt account once it is restored after the user deletes a transaction',
        syncAttachedDebtReturn,
        ({ debtAccount, transaction }) =>
            Effect.gen(function* () {
                const accountArchiveService = yield* AccountArchiveService;
                const transactionService = yield* TransactionService;
                yield* accountArchiveService.archiveById(debtAccount.id);
                yield* transactionService.deleteById(transaction.id);
                yield* accountArchiveService.restoreById(debtAccount.id);
            })
    );
});
