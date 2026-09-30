import { PRECISION, TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const seedTimeWindowPair = (incomeOffsetSeconds: number): void => {
    const { fromAccount, toAccount } = testSeedService.accountPair('UA-FROM', 'UA-TO');
    const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

    testSeedService.bankPairExpense(
        { externalId: 'time-window-expense', operatedAt },
        { accountId: fromAccount.id, amount: 100 * PRECISION, toIban: 'UA-TO' }
    );
    testSeedService.bankPairIncome(
        { externalId: 'time-window-income', operatedAt: new Date(operatedAt.getTime() + incomeOffsetSeconds * 1000) },
        { accountId: toAccount.id, amount: 100 * PRECISION }
    );
};

layer(TestLayer)('consolidation/time-window-boundary', it => {
    it.effect('matches a pair right at the time-window edge', () =>
        Effect.gen(function* () {
            seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS - 1);

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(1);
        })
    );

    it.effect('leaves a pair outside the time-window edge unconsolidated', () =>
        Effect.gen(function* () {
            seedTimeWindowPair(TRANSFER_PAIR_TIME_WINDOW_SECONDS + 60);

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        })
    );
});
