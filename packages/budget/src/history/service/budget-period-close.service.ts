import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getInclusiveEnd } from '../../period/utils/budget-period.util';
import { BudgetCategoryLimitRepository } from '../../query/repository/budget-category-limit.repository';
import { BudgetRepository } from '../../query/repository/budget.repository';
import { computeSpent } from '../../spent/utils/budget-spent.util';
import { BudgetPeriodSnapshotRepository } from '../repository/budget-period-snapshot.repository';
import { computeClosedPeriods } from '../utils/budget-closed-periods.util';

import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

export class BudgetPeriodCloseService extends Context.Service<BudgetPeriodCloseService>()('@budgie/budget/BudgetPeriodCloseService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;

        const snapshotPeriod = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId' | 'overallLimit' | 'otherLimit'>,
            categoryLimits: readonly BudgetCategoryLimitEntityInterface[],
            window: BudgetPeriodWindowInterface,
            isReconstructed: boolean
        ) {
            const entries = yield* budgetRepository.findBudgetSpentEntries(window.periodStart, window.nextPeriodStart, budget.instrumentId);
            const spent = computeSpent(entries, budget.instrumentId);
            const spentByCategory = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
            const categories = categoryLimits.map(limit => ({
                categoryId: limit.categoryId,
                limitAmount: limit.limitAmount,
                spent: spentByCategory.get(limit.categoryId) ?? 0
            }));
            const limitedSpent = categories.reduce((total, category) => total + category.spent, 0);

            yield* budgetPeriodSnapshotRepository.create(
                {
                    budgetId: budget.id,
                    periodStart: window.periodStart,
                    periodEnd: getInclusiveEnd(window.nextPeriodStart),
                    overallLimit: budget.overallLimit,
                    overallSpent: spent.spentOverall,
                    otherLimit: budget.otherLimit,
                    otherSpent: Math.max(0, spent.spentOverall - limitedSpent),
                    isReconstructed
                },
                categories
            );
        });

        return {
            closeDuePeriods: Effect.fn('BudgetPeriodCloseService.closeDuePeriods')(function* (now: Date) {
                const budget = yield* budgetRepository.findActive();

                if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId)) {
                    return;
                }

                const latestPeriodStart = yield* budgetPeriodSnapshotRepository.findLatestPeriodStart(budget.id);
                const earliestOperatedAt = yield* budgetRepository.findEarliestOperatedAt();
                const windows = computeClosedPeriods(budget, now, latestPeriodStart, earliestOperatedAt);
                const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);

                yield* Effect.forEach(windows, window => snapshotPeriod(budget, categoryLimits, window, !isDefined(latestPeriodStart)), {
                    discard: true
                });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetPeriodCloseService, BudgetPeriodCloseService.make).pipe(
        Layer.provide([BudgetRepository.layer, BudgetCategoryLimitRepository.layer, BudgetPeriodSnapshotRepository.layer])
    );
}
