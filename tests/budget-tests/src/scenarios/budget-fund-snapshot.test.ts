import { BudgetPeriodCloseService, BudgetPeriodSnapshotRepository, BudgetSinkingFundRepository } from '@budgie/budget';
import { AccountTypeEnum, BudgetRolloverModeEnum, BudgetSinkingFundEntityTable, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { createTestBudget } from '../harness/create-test-budget';
import { HISTORY_NOW } from '../harness/seed-budget-history';
import { seedCategorizedExpense } from '../harness/seed-categorized-expense';
import { testDb, TestLayer, testSeedService } from '../harness/test-context';

const units = (amount: number): number => amount * PRECISION;

const seedInsuranceScenario = (isInsuranceLimited: boolean) =>
    Effect.gen(function* () {
        const snapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const fundRepository = yield* BudgetSinkingFundRepository;
        const insurance = yield* testSeedService.category('Insurance');
        const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const categoryLimits = isInsuranceLimited ? [{ categoryId: insurance.id, limitAmount: units(100) }] : [];
        const budget = yield* createTestBudget({ categoryLimits, isAutoTuneEnabled: false });
        const fund = yield* fundRepository.create({
            budgetId: budget.id,
            name: 'Insurance',
            categoryId: insurance.id,
            targetAmount: units(600),
            dueAt: new Date(2026, 2, 20),
            fundedAmount: units(500)
        });

        yield* testDb
            .update(BudgetSinkingFundEntityTable)
            .set({ createdAt: new Date(2026, 0, 15) })
            .where(eq(BudgetSinkingFundEntityTable.id, fund.id));
        yield* seedCategorizedExpense({
            accountId: account.id,
            categoryId: insurance.id,
            operatedAt: new Date(2026, 2, 10, 12),
            amount: units(400),
            externalId: 'insurance-payment'
        });
        yield* snapshotRepository.create(
            {
                budgetId: budget.id,
                periodStart: new Date(2026, 0, 1),
                periodEnd: new Date(2026, 0, 31, 23, 59, 59, 999),
                overallLimit: budget.overallLimit,
                overallSpent: 0,
                otherLimit: budget.otherLimit,
                otherSpent: 0,
                otherCarriedIn: 0,
                otherRolloverMode: BudgetRolloverModeEnum.NONE,
                isReconstructed: false
            },
            []
        );

        return { budget, fund };
    });

const closeThenDropFundThenCloseAgain = (fundId: number) =>
    Effect.gen(function* () {
        const closeService = yield* BudgetPeriodCloseService;
        const fundRepository = yield* BudgetSinkingFundRepository;

        yield* closeService.closeDuePeriods(HISTORY_NOW);
        yield* fundRepository.delete(fundId);
        yield* closeService.closeDuePeriods(HISTORY_NOW);
    });

const findMarch = (budgetId: number) =>
    Effect.flatMap(BudgetPeriodSnapshotRepository, snapshotRepository =>
        Effect.map(snapshotRepository.findRecent(budgetId, 6), snapshots =>
            snapshots.find(snapshot => snapshot.periodStart.getTime() === new Date(2026, 2, 1).getTime())
        )
    );

layer(TestLayer)('snapshots net of sinking fund spend', it => {
    it.effect('stores a fund-paid bill in a limited category as covered, not as spend, and keeps it after the fund is settled', () =>
        Effect.gen(function* () {
            const { budget, fund } = yield* seedInsuranceScenario(true);

            yield* closeThenDropFundThenCloseAgain(fund.id);

            const march = yield* findMarch(budget.id);

            expect(march?.overallSpent).toBe(0);
            expect(march?.categories.map(category => [category.spent, category.fundCovered])).toEqual([[0, units(400)]]);
        })
    );

    it.effect('stores covered spend of categories without a limit on the Other side of the snapshot', () =>
        Effect.gen(function* () {
            const { budget, fund } = yield* seedInsuranceScenario(false);

            yield* closeThenDropFundThenCloseAgain(fund.id);

            const march = yield* findMarch(budget.id);

            expect(march?.overallSpent).toBe(0);
            expect(march?.otherSpent).toBe(0);
            expect(march?.otherFundCovered).toBe(units(400));
        })
    );
});
