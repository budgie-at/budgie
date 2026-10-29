import { BudgetLimitSourceEnum, BudgetRolloverModeEnum, Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { NO_FUND_COVERED } from '../../fund/constant/no-fund-covered.constant';
import { BudgetSinkingFundRepository } from '../../fund/repository/budget-sinking-fund.repository';
import { BudgetFundSpendService } from '../../fund/service/budget-fund-spend.service';
import { computeFundCovered } from '../../fund/utils/compute-fund-covered.util';
import { computeFundDueWindow } from '../../fund/utils/compute-fund-due-window.util';
import { contributeToFund } from '../../fund/utils/contribute-to-fund.util';
import { settleFund } from '../../fund/utils/settle-fund.util';
import { computeIncomeReceived } from '../../income/utils/compute-income-received.util';
import { resolveBudgetOverallLimit } from '../../income/utils/resolve-budget-overall-limit.util';
import { computePeriodWindow, getInclusiveEnd } from '../../period/utils/budget-period.util';
import { BudgetCategoryLimitRepository } from '../../query/repository/budget-category-limit.repository';
import { BudgetRepository } from '../../query/repository/budget.repository';
import { computeSnapshotCarryOuts } from '../../rollover/utils/budget-snapshot-carry-outs.util';
import { computeSpent } from '../../spent/utils/budget-spent.util';
import { toBudgetCurrencyEntries } from '../../spent/utils/to-budget-currency-entries.util';
import { BUDGET_TUNING_PERIOD_COUNT } from '../../tuning/constant/budget-tuning-period-count.constant';
import { BudgetLimitChangeRepository } from '../../tuning/repository/budget-limit-change.repository';
import { proposeLimitChanges } from '../../tuning/utils/propose-limit-changes.util';
import { BudgetPeriodSnapshotRepository } from '../repository/budget-period-snapshot.repository';
import { computeClosedPeriods } from '../utils/budget-closed-periods.util';
import { buildPeriodSnapshotRows } from '../utils/build-period-snapshot-rows.util';

import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetCarryOutsInterface } from '../../rollover/interface/budget-carry-outs.interface';
import type {
    BudgetCategoryLimitEntityInterface,
    BudgetEntityInterface,
    BudgetPeriodSnapshotWithCategoriesEntityInterface,
    BudgetSinkingFundEntityInterface
} from '@budgie/contracts';

const REFRESH_PERIOD_COUNT = 3;

export class BudgetPeriodCloseService extends Context.Service<BudgetPeriodCloseService>()('@budgie/budget/BudgetPeriodCloseService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const budgetLimitChangeRepository = yield* BudgetLimitChangeRepository;
        const budgetFundSpendService = yield* BudgetFundSpendService;
        const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;
        const maxFundSettlements = 12;

        const computeStoredCarryIn = (snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface): BudgetCarryOutsInterface => ({
            other: snapshot.otherCarriedIn,
            byCategory: new Map(snapshot.categories.map(category => [category.categoryId, category.carriedIn]))
        });

        const resolveOverallLimit = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'instrumentId' | 'overallLimit' | 'limitSource'>,
            window: BudgetPeriodWindowInterface
        ) {
            if (budget.limitSource === BudgetLimitSourceEnum.FIXED) {
                return budget.overallLimit;
            }

            const entries = yield* budgetRepository.findIncomeReceivedEntries(
                window.periodStart,
                window.nextPeriodStart,
                budget.instrumentId
            );
            const incomeReceived = computeIncomeReceived(entries, budget.instrumentId);

            return resolveBudgetOverallLimit(budget.limitSource, budget.overallLimit, incomeReceived, incomeReceived);
        });

        const loadClosedSpend = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>,
            limitedCategoryIds: ReadonlySet<number>,
            window: BudgetPeriodWindowInterface,
            isReconstructed: boolean
        ) {
            if (isReconstructed) {
                const rows = yield* budgetRepository.findBudgetSpentEntries(
                    window.periodStart,
                    window.nextPeriodStart,
                    budget.instrumentId
                );

                return { spent: computeSpent(rows, budget.instrumentId), fundCovered: NO_FUND_COVERED };
            }

            const { entries, draws } = yield* budgetFundSpendService.findSpentWithDraws(budget, window.periodStart, window.nextPeriodStart);

            return {
                spent: computeSpent(entries, budget.instrumentId),
                fundCovered: computeFundCovered(entries, draws, limitedCategoryIds)
            };
        });

        const makeSnapshotPeriod = (
            budget: Pick<
                BudgetEntityInterface,
                'id' | 'instrumentId' | 'overallLimit' | 'otherLimit' | 'otherRolloverMode' | 'limitSource'
            >,
            categoryLimits: readonly BudgetCategoryLimitEntityInterface[],
            isReconstructed: boolean
        ) =>
            Effect.fnUntraced(function* (window: BudgetPeriodWindowInterface, carryIn: BudgetCarryOutsInterface) {
                const { spent, fundCovered } = yield* loadClosedSpend(
                    budget,
                    new Set(categoryLimits.map(limit => limit.categoryId)),
                    window,
                    isReconstructed
                );
                const overallLimit = yield* resolveOverallLimit(budget, window);
                const limits = isReconstructed
                    ? categoryLimits.map(limit => ({ ...limit, rolloverMode: BudgetRolloverModeEnum.NONE }))
                    : categoryLimits;
                const rows = buildPeriodSnapshotRows(limits, spent, carryIn, fundCovered);
                const snapshot = {
                    budgetId: budget.id,
                    periodStart: window.periodStart,
                    periodEnd: getInclusiveEnd(window.nextPeriodStart),
                    overallLimit,
                    overallSpent: rows.overallSpent,
                    otherLimit: budget.otherLimit,
                    otherSpent: rows.otherSpent,
                    otherCarriedIn: rows.otherCarriedIn,
                    otherFundCovered: rows.otherFundCovered,
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
            const storedFundCovered = {
                byCategory: new Map(snapshot.categories.map(category => [category.categoryId, category.fundCovered])),
                other: snapshot.otherFundCovered
            };
            const rows = buildPeriodSnapshotRows(snapshot.categories, spent, carryIn, storedFundCovered);

            const categoryChanges = snapshot.categories.flatMap((category, index) => {
                const row = rows.categories[index];

                return isDefined(row) && (row.spent !== category.spent || row.carriedIn !== category.carriedIn)
                    ? [{ id: category.id, spent: row.spent, carriedIn: row.carriedIn }]
                    : [];
            });

            if (
                snapshot.overallSpent !== rows.overallSpent ||
                snapshot.otherSpent !== rows.otherSpent ||
                snapshot.otherCarriedIn !== rows.otherCarriedIn
            ) {
                yield* budgetPeriodSnapshotRepository.updateSnapshot(snapshot.id, {
                    overallSpent: rows.overallSpent,
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
                    (): BudgetCarryOutsInterface | null => null,
                    (previousCarryOuts, snapshot) => refreshPeriod(budget, snapshot, previousCarryOuts ?? computeStoredCarryIn(snapshot))
                )
            );
        });

        const settleDueFund = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'instrumentId'>,
            initialFund: Pick<BudgetSinkingFundEntityInterface, 'id' | 'categoryId' | 'fundedAmount' | 'dueAt' | 'repeatEveryMonths'>,
            recordedBalance: number,
            closedThrough: Date | null
        ) {
            let { fundedAmount, dueAt } = initialFund;
            let matchedBalance = recordedBalance;
            let isFinished = false;

            for (let settlement = 0; settlement < maxFundSettlements && !isFinished; settlement += 1) {
                const dueWindow = computeFundDueWindow(dueAt);

                if (!isDefined(closedThrough) || dueWindow.nextPeriodStart.getTime() > closedThrough.getTime()) {
                    break;
                }

                const rows = yield* budgetRepository.findBudgetSpentEntries(
                    dueWindow.periodStart,
                    dueWindow.nextPeriodStart,
                    budget.instrumentId
                );
                const settled = settleFund(
                    { ...initialFund, fundedAmount: matchedBalance, dueAt },
                    toBudgetCurrencyEntries(rows, budget.instrumentId)
                );

                fundedAmount = Math.max(fundedAmount - (matchedBalance - settled.fundedAmount), 0);
                matchedBalance = fundedAmount;
                ({ dueAt, isFinished } = settled);
            }

            return { fund: { ...initialFund, fundedAmount, dueAt }, isFinished };
        });

        const advanceFunds = Effect.fnUntraced(function* (budget: BudgetEntityInterface, windows: readonly BudgetPeriodWindowInterface[]) {
            const funds = yield* budgetSinkingFundRepository.getByBudget(budget.id);
            const [latestSnapshot] = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
            const closedThrough = isDefined(latestSnapshot) ? new Date(latestSnapshot.periodEnd.getTime() + 1) : null;

            yield* Effect.forEach(
                funds,
                Effect.fnUntraced(function* (fund) {
                    const contribution = contributeToFund(fund, windows, budget);
                    const settlement = yield* settleDueFund(
                        budget,
                        { ...fund, fundedAmount: contribution.fundedAmount },
                        fund.fundedAmount,
                        closedThrough
                    );

                    if (settlement.isFinished) {
                        yield* budgetSinkingFundRepository.delete(fund.id);

                        return;
                    }

                    const hasChanged =
                        settlement.fund.fundedAmount !== fund.fundedAmount ||
                        settlement.fund.dueAt.getTime() !== fund.dueAt.getTime() ||
                        contribution.lastFundedPeriodStart?.getTime() !== fund.lastFundedPeriodStart?.getTime();

                    if (hasChanged) {
                        yield* budgetSinkingFundRepository.update(fund.id, {
                            fundedAmount: settlement.fund.fundedAmount,
                            dueAt: settlement.fund.dueAt,
                            lastFundedPeriodStart: contribution.lastFundedPeriodStart
                        });
                    }
                }),
                { discard: true }
            );
        });

        const tuneLimits = Effect.fnUntraced(function* (
            budget: BudgetEntityInterface,
            categoryLimits: readonly BudgetCategoryLimitEntityInterface[],
            lastClosedWindow: BudgetPeriodWindowInterface,
            now: Date
        ) {
            if (!budget.isAutoTuneEnabled) {
                return;
            }

            const overallLimit = yield* resolveOverallLimit(budget, lastClosedWindow);
            const history = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, BUDGET_TUNING_PERIOD_COUNT);

            if (isEmptyArray(history)) {
                return;
            }

            const recentChanges = yield* budgetLimitChangeRepository.findSince(
                budget.id,
                new Date(Math.min(...history.map(snapshot => snapshot.periodStart.getTime())))
            );
            const proposals = proposeLimitChanges(
                history,
                {
                    overallLimit,
                    otherLimit: budget.otherLimit,
                    otherLimitUserEditedAt: budget.otherLimitUserEditedAt,
                    categories: categoryLimits
                },
                computePeriodWindow(budget, now).periodStart,
                recentChanges
            );

            if (isEmptyArray(proposals)) {
                return;
            }

            const limitIdByCategoryId = new Map(categoryLimits.map(limit => [limit.categoryId, limit.id]));
            const categoryUpdates = proposals.flatMap(proposal => {
                const id = isDefined(proposal.categoryId) ? limitIdByCategoryId.get(proposal.categoryId) : null;

                return isDefined(id) ? [{ id, limitAmount: proposal.newAmount }] : [];
            });
            const otherProposal = proposals.find(proposal => !isDefined(proposal.categoryId));

            yield* budgetCategoryLimitRepository.applyTunedLimits(categoryUpdates);

            if (isDefined(otherProposal)) {
                yield* budgetRepository.update(budget.id, { otherLimit: otherProposal.newAmount });
            }

            yield* budgetLimitChangeRepository.bulkCreate(
                proposals.map(proposal => ({
                    budgetId: budget.id,
                    categoryId: proposal.categoryId,
                    previousAmount: proposal.previousAmount,
                    newAmount: proposal.newAmount,
                    reason: proposal.reason,
                    periodsObserved: proposal.periodsObserved,
                    periodStart: lastClosedWindow.periodStart
                }))
            );
        });

        return {
            closeDuePeriods: Effect.fn('BudgetPeriodCloseService.closeDuePeriods')(
                function* (now: Date) {
                    const budget = yield* budgetRepository.findMain();

                    if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId)) {
                        return;
                    }

                    const [latestSnapshot] = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
                    const latestPeriodStart = isDefined(latestSnapshot) ? latestSnapshot.periodStart : null;
                    const earliestOperatedAt = yield* budgetRepository.findEarliestOperatedAt();
                    const windows = computeClosedPeriods(budget, now, latestPeriodStart, earliestOperatedAt);
                    const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);

                    const snapshotPeriod = makeSnapshotPeriod(budget, categoryLimits, !isDefined(latestSnapshot));

                    yield* Effect.reduce(
                        windows,
                        () => computeSnapshotCarryOuts(latestSnapshot),
                        (carryIn, window) => snapshotPeriod(window, carryIn)
                    );
                    yield* refreshRecentPeriods(budget);
                    yield* advanceFunds(budget, windows);

                    const lastClosedWindow = windows.at(-1);

                    if (isDefined(lastClosedWindow)) {
                        yield* tuneLimits(budget, categoryLimits, lastClosedWindow, now);
                    }
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetPeriodCloseService, BudgetPeriodCloseService.make).pipe(
        Layer.provide([
            BudgetRepository.layer,
            BudgetCategoryLimitRepository.layer,
            BudgetPeriodSnapshotRepository.layer,
            BudgetLimitChangeRepository.layer,
            BudgetFundSpendService.layer,
            BudgetSinkingFundRepository.layer
        ])
    );
}
