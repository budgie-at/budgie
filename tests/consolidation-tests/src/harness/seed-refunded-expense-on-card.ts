import * as Effect from 'effect/Effect';

import { testSeedService } from './test-context';

export const seedRefundedExpenseOnCard = (
    cardExternalId: string,
    input: Omit<Parameters<typeof testSeedService.refundedExpense>[0], 'accountId'>
) =>
    Effect.gen(function* () {
        const account = yield* testSeedService.account({ externalId: cardExternalId });

        return { account, ...(yield* testSeedService.refundedExpense({ ...input, accountId: account.id })) };
    });
