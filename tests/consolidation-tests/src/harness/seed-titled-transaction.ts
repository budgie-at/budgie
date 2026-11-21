import * as Effect from 'effect/Effect';

import { testSeedService } from './test-context';

export const seedTitledTransaction = Effect.fnUntraced(function* (input: {
    readonly accountId: number;
    readonly amount: number;
    readonly externalId: string;
    readonly isRefund: boolean;
    readonly operatedAt: Date;
    readonly title: string;
}) {
    const entry = { accountId: input.accountId, amount: input.amount };
    const header = { externalId: input.externalId, operatedAt: input.operatedAt };
    const transaction = input.isRefund
        ? yield* testSeedService.bankPairIncome(header, entry)
        : yield* testSeedService.bankPairExpense(header, entry);

    yield* testSeedService.updateTransaction(transaction.id, { title: input.title });

    return transaction;
});
