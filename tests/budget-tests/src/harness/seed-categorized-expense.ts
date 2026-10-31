import { TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, testSeedService } from './test-context';

interface SeedCategorizedExpenseInput {
    readonly accountId: number;
    readonly categoryId: number;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly externalId: string;
}

export const seedCategorizedExpense = Effect.fnUntraced(function* (input: SeedCategorizedExpenseInput) {
    const transaction = yield* testSeedService.bankPairExpense(
        { externalId: input.externalId, operatedAt: input.operatedAt },
        { accountId: input.accountId, amount: input.amount }
    );

    yield* testDb
        .update(TransactionEntryEntityTable)
        .set({ categoryId: input.categoryId })
        .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));

    return transaction;
});
