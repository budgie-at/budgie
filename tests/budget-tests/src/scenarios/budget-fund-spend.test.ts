import { BudgetFundSpendService, BudgetSinkingFundRepository } from '@budgie/budget';
import { AccountTypeEnum, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { createTestBudget } from '../harness/create-test-budget';
import { seedCategorizedExpense } from '../harness/seed-categorized-expense';
import { TestLayer, testSeedService } from '../harness/test-context';

const units = (amount: number): number => amount * PRECISION;

const seedExpenses = Effect.fnUntraced(function* () {
    const groceries = yield* testSeedService.category('Groceries');
    const insurance = yield* testSeedService.category('Insurance');
    const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const budget = yield* createTestBudget();
    const expense = (categoryId: number, operatedAt: Date, amount: number, externalId: string) =>
        seedCategorizedExpense({ accountId: account.id, categoryId, operatedAt, amount: units(amount), externalId });

    yield* expense(insurance.id, new Date(2026, 11, 1, 12), 300, 'insurance-first');
    yield* expense(insurance.id, new Date(2026, 11, 5, 12), 400, 'insurance-second');
    yield* expense(groceries.id, new Date(2026, 11, 2, 12), 50, 'groceries');

    return { budget, groceries, insurance };
});

layer(TestLayer)('BudgetFundSpendService', it => {
    it.effect('removes the part of spending covered by a sinking fund and keeps the excess', () =>
        Effect.gen(function* () {
            const fundSpendService = yield* BudgetFundSpendService;
            const fundRepository = yield* BudgetSinkingFundRepository;
            const { budget, groceries, insurance } = yield* seedExpenses();

            yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Insurance',
                categoryId: insurance.id,
                targetAmount: units(1200),
                dueAt: new Date(2026, 11, 15),
                fundedAmount: units(500)
            });

            const entries = yield* fundSpendService.findSpentEntries(budget, new Date(2026, 11, 1), new Date(2027, 0, 1));
            const sorted = [...entries].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime());

            expect(sorted.map(entry => [entry.categoryId, entry.amount])).toEqual([
                [groceries.id, units(50)],
                [insurance.id, units(200)]
            ]);
        })
    );

    it.effect('returns the gross entries and the draws separately for period close', () =>
        Effect.gen(function* () {
            const fundSpendService = yield* BudgetFundSpendService;
            const fundRepository = yield* BudgetSinkingFundRepository;
            const { budget, insurance } = yield* seedExpenses();
            const fund = yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Insurance',
                categoryId: insurance.id,
                targetAmount: units(1200),
                dueAt: new Date(2026, 11, 15),
                fundedAmount: units(500)
            });
            const { entries, draws } = yield* fundSpendService.findSpentWithDraws(budget, new Date(2026, 11, 1), new Date(2027, 0, 1));

            expect(entries.map(entry => entry.amount).sort((first, second) => first - second)).toEqual([units(50), units(300), units(400)]);
            expect(draws.map(draw => [draw.fundId, draw.amount]).sort((first, second) => first[1] - second[1])).toEqual([
                [fund.id, units(200)],
                [fund.id, units(300)]
            ]);
        })
    );

    it.effect('returns all spending in the budget currency when there are no funds', () =>
        Effect.gen(function* () {
            const fundSpendService = yield* BudgetFundSpendService;
            const { budget } = yield* seedExpenses();
            const entries = yield* fundSpendService.findSpentEntries(budget, new Date(2026, 11, 1), new Date(2027, 0, 1));

            expect(entries.map(entry => entry.amount).sort((first, second) => first - second)).toEqual([units(50), units(300), units(400)]);
        })
    );
});
