import { BudgetSinkingFundRepository } from '@budgie/budget';
import { AccountTypeEnum, BudgetSinkingFundEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { createTestBudget } from './create-test-budget';
import { testDb, testSeedService } from './test-context';
import { units } from './units';

import type { BudgetSinkingFundCreateEntityInterface } from '@budgie/contracts';

export const seedInsuranceFund = Effect.fnUntraced(function* (
    isInsuranceLimited: boolean,
    fundFields: Partial<Pick<BudgetSinkingFundCreateEntityInterface, 'fundedAmount' | 'repeatEveryMonths'>>
) {
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
        ...fundFields
    });

    yield* testDb
        .update(BudgetSinkingFundEntityTable)
        .set({ createdAt: new Date(2026, 0, 15) })
        .where(eq(BudgetSinkingFundEntityTable.id, fund.id));

    return { account, budget, fund, insurance };
});
