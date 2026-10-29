import { BudgetPeriodCloseService, BudgetPeriodSnapshotRepository, BudgetSinkingFundRepository } from '@budgie/budget';
import { AccountTypeEnum, BudgetSinkingFundEntityTable } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    createTestBudget,
    HISTORY_NOW,
    seedCategorizedExpense,
    seedMonthSnapshot,
    testDb,
    TestLayer,
    testSeedService,
    units
} from '../harness';

layer(TestLayer)('catch-up close covers spend with funds accumulated earlier in the run', it => {
    it.effect('covers the third period with the contributions of the first two, capped at the spend', () =>
        Effect.gen(function* () {
            const fundRepository = yield* BudgetSinkingFundRepository;
            const insurance = yield* testSeedService.category('Insurance');
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            const budget = yield* createTestBudget({ categoryLimits: [], isAutoTuneEnabled: false });
            const fund = yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Insurance',
                categoryId: insurance.id,
                targetAmount: units(600),
                dueAt: new Date(2026, 2, 20),
                repeatEveryMonths: 12
            });

            yield* testDb
                .update(BudgetSinkingFundEntityTable)
                .set({ createdAt: new Date(2026, 0, 15) })
                .where(eq(BudgetSinkingFundEntityTable.id, fund.id));
            const groceries = yield* testSeedService.category('Groceries');

            yield* Effect.forEach(
                [1, 2],
                monthIndex =>
                    seedCategorizedExpense({
                        accountId: account.id,
                        categoryId: groceries.id,
                        operatedAt: new Date(2026, monthIndex, 10, 12),
                        amount: units(50),
                        externalId: `groceries-${monthIndex}`
                    }),
                { discard: true }
            );
            yield* seedCategorizedExpense({
                accountId: account.id,
                categoryId: insurance.id,
                operatedAt: new Date(2026, 3, 10, 12),
                amount: units(900),
                externalId: 'insurance-april'
            });
            yield* seedMonthSnapshot(budget, new Date(2026, 0, 1), 0);

            yield* Effect.flatMap(BudgetPeriodCloseService, closeService => closeService.closeDuePeriods(HISTORY_NOW));

            const snapshots = yield* Effect.flatMap(BudgetPeriodSnapshotRepository, snapshotRepository =>
                snapshotRepository.findRecent(budget.id, 6)
            );
            const april = snapshots.find(snapshot => snapshot.periodStart.getTime() === new Date(2026, 3, 1).getTime());
            const [rolled] = yield* fundRepository.getByBudget(budget.id);

            expect(april?.otherFundCovered).toBe(units(600));
            expect(april?.overallSpent).toBe(units(300));
            expect(rolled.fundedAmount).toBe(0);
            expect(rolled.dueAt).toEqual(new Date(2027, 2, 20));
        })
    );
});
