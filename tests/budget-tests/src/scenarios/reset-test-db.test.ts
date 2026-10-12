import { resetTestDb } from '@budgie-at/test-kit';
import { BudgetRepository, BudgetService } from '@budgie/budget';
import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer, testDb } from '../harness/test-context';

layer(TestLayer)('resetTestDb', it => {
    it.effect('removes budget rows between tests', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const budgetService = yield* BudgetService;

            yield* budgetService.createBudget({
                name: 'Leaked Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 1,
                useLastDayOfMonth: false,
                overallLimit: 1,
                otherLimit: 1,
                instrumentId: 1,
                categoryLimits: []
            });
            yield* resetTestDb(testDb);

            expect(yield* budgetRepository.findActive()).toBeFalsy();
        })
    );
});
