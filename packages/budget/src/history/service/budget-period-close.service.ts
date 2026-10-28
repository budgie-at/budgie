import { BudgetRolloverModeEnum, Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getInclusiveEnd } from '../../period/utils/budget-period.util';
import { BudgetCategoryLimitRepository } from '../../query/repository/budget-category-limit.repository';
import { BudgetRepository } from '../../query/repository/budget.repository';
import { computeSnapshotCarryOuts } from '../../rollover/utils/budget-snapshot-carry-outs.util';
import { computeSpent } from '../../spent/utils/budget-spent.util';
import { BudgetPeriodSnapshotRepository } from '../repository/budget-period-snapshot.repository';
import { computeClosedPeriods } from '../utils/budget-closed-periods.util';
import { buildPeriodSnapshotRows } from '../utils/build-period-snapshot-rows.util';

import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetCarryOutsInterface } from '../../rollover/interface/budget-carry-outs.interface';
import type {
    BudgetCategoryLimitEntityInterface,
    BudgetEntityInterface,
    BudgetPeriodSnapshotWithCategoriesEntityInterface
} from '@budgie/contracts';

const REFRESH_PERIOD_COUNT = 3;

export class BudgetPeriodCloseService extends Context.Service<BudgetPeriodCloseService>()('@budgie/budget/BudgetPeriodCloseService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;

        const computeStoredCarryIn = (snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface): BudgetCarryOutsInterface => ({
            other: snapshot.otherCarriedIn,
            byCategory: new Map(snapshot.categories.map(category => [category.categoryId, category.carriedIn]))
        });

        const snapshotPeriod = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId' | 'overallLimit' | 'otherLimit' | 'otherRolloverMode'>,
            categoryLimits: readonly BudgetCategoryLimitEntityInterface[],
            window: BudgetPeriodWindowInterface,
            carryIn: BudgetCarryOutsInterface,
            isReconstructed: boolean
        ) {
            const entries = yield* budgetRepository.findBudgetSpentEntries(window.periodStart, window.nextPeriodStart, budget.instrumentId);
            const spent = computeSpent(entries, budget.instrumentId);
            const limits = isReconstructed
                ? categoryLimits.map(limit => ({ ...limit, rolloverMode: BudgetRolloverModeEnum.NONE }))
                : categoryLimits;
            const rows = buildPeriodSnapshotRows(limits, spent, carryIn);
            const snapshot = {
                budgetId: budget.id,
                periodStart: window.periodStart,
                periodEnd: getInclusiveEnd(window.nextPeriodStart),
                overallLimit: budget.overallLimit,
                overallSpent: spent.spentOverall,
                otherLimit: budget.otherLimit,
                otherSpent: rows.otherSpent,
                otherCarriedIn: rows.otherCarriedIn,
                otherRolloverMode: isReconstructed ? BudgetRolloverModeEnum.NONE : budget.otherRolloverMode,
                isReconstructed
            };

            yield* budgetPeriodSnapshotRepository.create(snapshot, rows.categories);

            return computeSnapshotCarryOuts({ ...snapshot, categories: rows.categories });
        });

        const refreshPeriod = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'instrumentId'>,
            snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface,
            carryIn: BudgetCarryOutsInterface
        ) {
            const entries = yield* budgetRepository.findBudgetSpentEntries(
                snapshot.periodStart,
                new Date(snapshot.periodEnd.getTime() + 1),
                budget.instrumentId
            );
            const spent = computeSpent(entries, budget.instrumentId);
            const rows = buildPeriodSnapshotRows(snapshot.categories, spent, carryIn);

            const categoryChanges = snapshot.categories.flatMap((category, index) => {
                const row = rows.categories[index];

                return isDefined(row) && (row.spent !== category.spent || row.carriedIn !== category.carriedIn)
                    ? [{ id: category.id, spent: row.spent, carriedIn: row.carriedIn }]
                    : [];
            });

            if (
                snapshot.overallSpent !== spent.spentOverall ||
                snapshot.otherSpent !== rows.otherSpent ||
                snapshot.otherCarriedIn !== rows.otherCarriedIn
            ) {
                yield* budgetPeriodSnapshotRepository.updateSnapshot(snapshot.id, {
                    overallSpent: spent.spentOverall,
                    otherSpent: rows.otherSpent,
                    otherCarriedIn: rows.otherCarriedIn
                });
            }

            yield* Effect.forEach(
                categoryChanges,
                change =>
                    budgetPeriodSnapshotRepository.updateCategorySnapshot(change.id, { spent: change.spent, carriedIn: change.carriedIn }),
                { discard: true }
            );

            return computeSnapshotCarryOuts({
                ...snapshot,
                otherSpent: rows.otherSpent,
                otherCarriedIn: rows.otherCarriedIn,
                categories: rows.categories
            });
        });

        const refreshRecentPeriods = Effect.fnUntraced(function* (budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>) {
            const recentSnapshots = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, REFRESH_PERIOD_COUNT);
            const refreshable = recentSnapshots.filter(snapshot => !snapshot.isReconstructed).reverse();

            yield* Db.transaction(
                Effect.reduce(
                    refreshable,
                    (): BudgetCarryOutsInterface | undefined => undefined,
                    (previousCarryOuts, snapshot) => refreshPeriod(budget, snapshot, previousCarryOuts ?? computeStoredCarryIn(snapshot))
                )
            );
        });

        return {
            closeDuePeriods: Effect.fn('BudgetPeriodCloseService.closeDuePeriods')(function* (now: Date) {
                const budget = yield* budgetRepository.findActive();

                if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId)) {
                    return;
                }

                const [latestSnapshot] = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
                const latestPeriodStart = isDefined(latestSnapshot) ? latestSnapshot.periodStart : null;
                const earliestOperatedAt = yield* budgetRepository.findEarliestOperatedAt();
                const windows = computeClosedPeriods(budget, now, latestPeriodStart, earliestOperatedAt);
                const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);

                yield* Effect.reduce(
                    windows,
                    () => computeSnapshotCarryOuts(latestSnapshot),
                    (carryIn, window) => snapshotPeriod(budget, categoryLimits, window, carryIn, !isDefined(latestSnapshot))
                );
                yield* refreshRecentPeriods(budget);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetPeriodCloseService, BudgetPeriodCloseService.make).pipe(
        Layer.provide([BudgetRepository.layer, BudgetCategoryLimitRepository.layer, BudgetPeriodSnapshotRepository.layer])
    );
}
