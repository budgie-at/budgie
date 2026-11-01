import { BudgetSinkingFundRepository } from '@budgie/budget';
import { PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { createTestBudget } from '../harness/create-test-budget';
import { TestLayer, testSeedService } from '../harness/test-context';

layer(TestLayer)('BudgetSinkingFundRepository', it => {
    it.effect('creates, orders by due date, updates and soft deletes funds', () =>
        Effect.gen(function* () {
            const fundRepository = yield* BudgetSinkingFundRepository;
            const budget = yield* createTestBudget();
            const category = yield* testSeedService.category('Insurance');
            const later = yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Car insurance',
                categoryId: category.id,
                targetAmount: 1_200 * PRECISION,
                dueAt: new Date(2026, 11, 15)
            });
            const sooner = yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Vacation',
                categoryId: category.id,
                targetAmount: 600 * PRECISION,
                dueAt: new Date(2026, 5, 1),
                repeatEveryMonths: 12
            });

            expect((yield* fundRepository.getByBudget(budget.id)).map(fund => fund.name)).toEqual(['Vacation', 'Car insurance']);
            expect(later.fundedAmount).toBe(0);
            expect(sooner.repeatEveryMonths).toBe(12);

            const updated = yield* fundRepository.update(later.id, { fundedAmount: 300 * PRECISION });

            expect(updated.fundedAmount).toBe(300 * PRECISION);

            yield* fundRepository.delete(sooner.id);

            expect((yield* fundRepository.getByBudget(budget.id)).map(fund => fund.name)).toEqual(['Car insurance']);
        })
    );
});
