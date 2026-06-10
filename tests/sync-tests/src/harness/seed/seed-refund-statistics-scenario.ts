import { eq } from 'drizzle-orm';

import { CategoryEntityTable, PRECISION, TransactionEntryEntityTable } from '@budgie/contracts';

import { testDb } from '../scenario/setup';

import { seedRefundedExpense } from './seed-refund-fixture';
import { seed } from './seed';

export const seedRefundStatisticsScenario = (refundAmount: number) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const account = seed.account({ externalId: `mono-refund-${refundAmount}` });
    const { expense } = seedRefundedExpense({
        accountId: account.id,
        expenseAmount: 120 * PRECISION,
        refundAmounts: [refundAmount]
    });

    testDb
        .update(TransactionEntryEntityTable)
        .set({ categoryId: category.id })
        .where(eq(TransactionEntryEntityTable.transactionId, expense.id))
        .run();

    return {
        account,
        category
    };
};
