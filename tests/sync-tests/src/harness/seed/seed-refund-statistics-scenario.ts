import { CategoryEntityTable, PRECISION, TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

import { seed } from './seed';
import { seedRefundedExpense } from './seed-refund-fixture';

const REFUNDED_EXPENSE_AMOUNT = Number('120') * PRECISION;

export const seedRefundStatisticsScenario = (refundAmount: number) =>
    Effect.gen(function* () {
        const [category] = yield* testDb.select().from(CategoryEntityTable);
        const account = yield* seed.account({ externalId: `mono-refund-${refundAmount}` });
        const { expense } = yield* seedRefundedExpense({
            accountId: account.id,
            expenseAmount: REFUNDED_EXPENSE_AMOUNT,
            refundAmounts: [refundAmount]
        });

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ categoryId: category.id })
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

        return {
            account,
            category,
            expense
        };
    });
