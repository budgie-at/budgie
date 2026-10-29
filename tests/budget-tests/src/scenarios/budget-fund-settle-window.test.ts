import { BudgetPeriodCloseService, BudgetPeriodSnapshotRepository, BudgetSinkingFundRepository } from '@budgie/budget';
import { AccountTypeEnum, BudgetSinkingFundEntityTable } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { createTestBudget, seedInsurancePayment, seedMonthSnapshot, testDb, TestLayer, testSeedService, units } from '../harness';

const JANUARY_CLOSE = new Date(2027, 0, 16, 12);
const FEBRUARY_CLOSE = new Date(2027, 1, 2, 12);

layer(TestLayer)('sinking fund settlement waits for its due window to close', it => {
    it.effect('keeps the fund until the last period of the due window has closed and keeps that period covered', () =>
        Effect.gen(function* () {
            const closeService = yield* BudgetPeriodCloseService;
            const fundRepository = yield* BudgetSinkingFundRepository;
            const snapshotRepository = yield* BudgetPeriodSnapshotRepository;
            const insurance = yield* testSeedService.category('Insurance');
            const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            const budget = yield* createTestBudget({
                categoryLimits: [{ categoryId: insurance.id, limitAmount: units(100) }],
                isAutoTuneEnabled: false
            });
            const fund = yield* fundRepository.create({
                budgetId: budget.id,
                name: 'Insurance',
                categoryId: insurance.id,
                targetAmount: units(600),
                dueAt: new Date(2026, 11, 15),
                fundedAmount: units(500)
            });

            yield* testDb
                .update(BudgetSinkingFundEntityTable)
                .set({ createdAt: new Date(2027, 0, 10) })
                .where(eq(BudgetSinkingFundEntityTable.id, fund.id));
            yield* seedMonthSnapshot(budget, new Date(2026, 11, 1), 0);
            yield* seedInsurancePayment(account.id, insurance.id, new Date(2027, 0, 5, 12));

            yield* closeService.closeDuePeriods(JANUARY_CLOSE);

            const [stillFunded] = yield* fundRepository.getByBudget(budget.id);

            expect(stillFunded.fundedAmount).toBe(units(500));

            yield* closeService.closeDuePeriods(FEBRUARY_CLOSE);

            const january = (yield* snapshotRepository.findRecent(budget.id, 3)).find(
                snapshot => snapshot.periodStart.getTime() === new Date(2027, 0, 1).getTime()
            );

            expect(yield* fundRepository.getByBudget(budget.id)).toEqual([]);
            expect(january?.categories.map(category => [category.spent, category.fundCovered])).toEqual([[0, units(400)]]);
        })
    );
});
