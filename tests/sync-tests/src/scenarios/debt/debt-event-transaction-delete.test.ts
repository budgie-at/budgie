import { AccountTypeEnum, DebtEventEntityTable, PRECISION, TransactionEntityTable } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionDebtSettlementService, TransactionService } from '@budgie/ledger';
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

const fetchDebtEvents = (transactionId: number) =>
    testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId));

describe('debt/debt-event-transaction-delete', () => {
    it.effect('removes the debt event and restores the debt balance when the user deletes a synced transaction', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const { debtAccount, debtBalanceBefore, transaction } = yield* syncAttachedDebtReturn;
            expect(yield* fetchDebtEvents(transaction.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(debtAccount.id)).not.toStrictEqual(debtBalanceBefore);

            yield* transactionService.deleteById(transaction.id);

            expect(yield* fetchDebtEvents(transaction.id)).toHaveLength(0);
            expect(yield* fetchAccountBalance(debtAccount.id)).toStrictEqual(debtBalanceBefore);
        }).pipe(Effect.provide(TestLayer))
    );
});
