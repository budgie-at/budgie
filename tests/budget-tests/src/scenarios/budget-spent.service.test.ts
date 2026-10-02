import { BudgetSpentService } from '@budgie/budget';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../harness/test-context';

layer(TestLayer)('budgetSpentService', it => {
    it.effect('converts entries to the budget instrument and groups categorized spend', () =>
        Effect.gen(function* () {
            const budgetSpentService = yield* BudgetSpentService;
            const spent = budgetSpentService.computeSpent(
                [
                    { amount: 10_000_000, categoryId: 11, instrumentId: 1, rate: null },
                    { amount: 20_000_000, categoryId: 11, instrumentId: 2, rate: 2 },
                    { amount: 5_000_000, categoryId: null, instrumentId: 2, rate: 2 }
                ],
                1
            );

            expect(spent).toEqual({
                spentOverall: 60_000_000,
                spentByCategory: [{ categoryId: 11, spent: 50_000_000 }]
            });
        })
    );
});
