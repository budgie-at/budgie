import { CategoryEntityTable, PRECISION, TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

import { seed } from './seed';
import { seedRefundedExpense } from './seed-refund-fixture';

const REFUNDED_EXPENSE_AMOUNT = Number('120') * PRECISION;

export const seedRefundStatisticsScenario = (refundAmount: number) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const account = seed.account({ externalId: `mono-refund-${refundAmount}` });
    const { expense } = seedRefundedExpense({
        accountId: account.id,
        expenseAmount: REFUNDED_EXPENSE_AMOUNT,
        refundAmounts: [refundAmount]
    });

    testDb
        .update(TransactionEntryEntityTable)
        .set({ categoryId: category.id })
        .where(eq(TransactionEntryEntityTable.transactionId, expense.id))
        .run();

    return {
        account,
        category,
        expense
    };
};
