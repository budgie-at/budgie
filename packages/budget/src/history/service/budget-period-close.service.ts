import { BudgetLimitSourceEnum, BudgetRolloverModeEnum, Db } from '@budgie/contracts';
import { addMilliseconds } from 'date-fns/addMilliseconds';
import { addMonths } from 'date-fns/addMonths';
import { min } from 'date-fns/min';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { NO_FUND_COVERED } from '../../fund/constant/no-fund-covered.constant';
import { BudgetSinkingFundRepository } from '../../fund/repository/budget-sinking-fund.repository';
import { BudgetFundSpendService } from '../../fund/service/budget-fund-spend.service';
import { computeFundCovered } from '../../fund/utils/compute-fund-covered.util';
import { computeFundDueWindow } from '../../fund/utils/compute-fund-due-window.util';
import { contributeToFund } from '../../fund/utils/contribute-to-fund.util';
import { matchFundSpend } from '../../fund/utils/match-fund-spend.util';
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

import type { BudgetFundCloseStateInterface } from '../../fund/interface/budget-fund-close-state.interface';
import type { BudgetFundDrawInterface } from '../../fund/interface/budget-fund-draw.interface';
import type { BudgetFundMatchInterface } from '../../fund/interface/budget-fund-match.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetCarryOutsInterface } from '../../rollover/interface/budget-carry-outs.interface';
import type {
    BudgetCategoryLimitEntityInterface,
    BudgetEntityInterface,
    BudgetPeriodSnapshotWithCategoriesEntityInterface,
    BudgetSinkingFundEntityInterface
} from '@budgie/contracts';

export class BudgetPeriodCloseService extends Context.Service<BudgetPeriodCloseService>()('@budgie/budget/BudgetPeriodCloseService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const budgetLimitChangeRepository = yield* BudgetLimitChangeRepository;
        const budgetFundSpendService = yield* BudgetFundSpendService;
        const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;
        const refreshPeriodCount = 3;
        const maxFundSettlements = 12;

        const computeStoredCarryIn = (snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface): BudgetCarryOutsInterface => ({
            other: snapshot.otherCarriedIn,
            byCategory: new Map(snapshot.categories.map(category => [category.categoryId, category.carriedIn]))
        });

        const resolveOverallLimit = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'instrumentId' | 'overallLimit' | 'limitSource' | 'syncZone'>,
            window: BudgetPeriodWindowInterface
        ) {
            if (budget.limitSource === BudgetLimitSourceEnum.FIXED) {
                return budget.overallLimit;
            }

            const entries = yield* budgetRepository.findIncomeReceivedEntries(
                window.periodStart,
                window.nextPeriodStart,
                budget.instrumentId,
                budget.syncZone
            );
            const incomeReceived = computeIncomeReceived(entries, budget.instrumentId);

            return resolveBudgetOverallLimit(budget.limitSource, budget.overallLimit, incomeReceived, incomeReceived);
        });

        const loadClosedSpend = (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId' | 'syncZone'>,
            limitedCategoryIds: ReadonlySet<number>,
            isReconstructed: boolean
        ) =>
            Effect.fnUntraced(function* (window: BudgetPeriodWindowInterface, funds: readonly BudgetFundMatchInterface[]) {
                if (isReconstructed) {
                    const rows = yield* budgetRepository.findBudgetSpentEntries(
                        window.periodStart,
                        window.nextPeriodStart,
                        budget.instrumentId,
                        budget.syncZone
                    );

                    return { spent: computeSpent(rows, budget.instrumentId), fundCovered: NO_FUND_COVERED, draws: [] };
                }

                const { entries, draws } = yield* budgetFundSpendService.findSpentWithDrawsAgainst(
                    budget,
                    funds,
                    window.periodStart,
                    window.nextPeriodStart
                );

                return {
                    spent: computeSpent(entries, budget.instrumentId),
                    fundCovered: computeFundCovered(entries, draws, limitedCategoryIds),
                    draws
                };
            });

        const makeSnapshotPeriod = (
            budget: Pick<
                BudgetEntityInterface,
                'id' | 'instrumentId' | 'overallLimit' | 'otherLimit' | 'otherRolloverMode' | 'limitSource' | 'syncZone'
            >,
            categoryLimits: readonly BudgetCategoryLimitEntityInterface[],
            isReconstructed: boolean
        ) => {
            const loadSpend = loadClosedSpend(budget, new Set(categoryLimits.map(limit => limit.categoryId)), isReconstructed);

            return Effect.fnUntraced(function* (
                window: BudgetPeriodWindowInterface,
                carryIn: BudgetCarryOutsInterface,
                funds: readonly BudgetFundMatchInterface[]
            ) {
                const { spent, fundCovered, draws } = yield* loadSpend(window, funds);
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

                return { carryOuts: computeSnapshotCarryOuts({ ...snapshot, categories: rows.categories }), draws };
            });
        };

        const refreshPeriod = (
            budget: Pick<BudgetEntityInterface, 'instrumentId'>,
            snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface,
            carryIn: BudgetCarryOutsInterface,
            entries: Effect.Success<ReturnType<typeof budgetRepository.findBudgetSpentEntries>>
        ) => {
            const startMs = snapshot.periodStart.getTime();
            const endMs = snapshot.periodEnd.getTime();
            const periodEntries = entries.filter(entry => entry.operatedAt.getTime() >= startMs && entry.operatedAt.getTime() <= endMs);
            const spent = computeSpent(periodEntries, budget.instrumentId);
            const storedFundCovered = {
                byCategory: new Map(snapshot.categories.map(category => [category.categoryId, category.fundCovered])),
                other: snapshot.otherFundCovered
            };
            const rows = buildPeriodSnapshotRows(snapshot.categories, spent, carryIn, storedFundCovered);

            const categoryUpdates = snapshot.categories.flatMap((category, index) => {
                const row = rows.categories[index];

                return isDefined(row) && (row.spent !== category.spent || row.carriedIn !== category.carriedIn)
                    ? [{ id: category.id, spent: row.spent, carriedIn: row.carriedIn }]
                    : [];
            });
            const snapshotUpdate =
                snapshot.overallSpent !== rows.overallSpent ||
                snapshot.otherSpent !== rows.otherSpent ||
                snapshot.otherCarriedIn !== rows.otherCarriedIn
                    ? {
                          id: snapshot.id,
                          input: {
                              overallSpent: rows.overallSpent,
                              otherSpent: rows.otherSpent,
                              otherCarriedIn: rows.otherCarriedIn
                          }
                      }
                    : null;

            return {
                snapshotUpdate,
                categoryUpdates,
                carryOuts: computeSnapshotCarryOuts({
                    ...snapshot,
                    otherSpent: rows.otherSpent,
                    otherCarriedIn: rows.otherCarriedIn,
                    categories: rows.categories
                })
            };
        };

        const refreshRecentPeriods = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId' | 'syncZone'>,
            recentSnapshots: readonly BudgetPeriodSnapshotWithCategoriesEntityInterface[]
        ) {
            const refreshable = recentSnapshots.filter(snapshot => !snapshot.isReconstructed).reverse();

            if (isEmptyArray(refreshable)) {
                return;
            }

            const periodStart = min(refreshable.map(snapshot => snapshot.periodStart));
            const nextPeriodStart = addMilliseconds(
                refreshable.reduce(
                    (latest, snapshot) => (snapshot.periodEnd.getTime() > latest.getTime() ? snapshot.periodEnd : latest),
                    refreshable[0].periodEnd
                ),
                1
            );
            const entries = yield* budgetRepository.findBudgetSpentEntries(
                periodStart,
                nextPeriodStart,
                budget.instrumentId,
                budget.syncZone
            );
            const snapshotUpdates: {
                readonly id: number;
                readonly input: { readonly overallSpent: number; readonly otherSpent: number; readonly otherCarriedIn: number };
            }[] = [];
            const categoryUpdates: { readonly id: number; readonly spent: number; readonly carriedIn: number }[] = [];
            let previousCarryOuts: BudgetCarryOutsInterface | null = null;

            for (const snapshot of refreshable) {
                const result = refreshPeriod(budget, snapshot, previousCarryOuts ?? computeStoredCarryIn(snapshot), entries);
                previousCarryOuts = result.carryOuts;

                if (isDefined(result.snapshotUpdate)) {
                    snapshotUpdates.push(result.snapshotUpdate);
                }

                if (isNotEmptyArray(result.categoryUpdates)) {
                    categoryUpdates.push(...result.categoryUpdates);
                }
            }

            if (isEmptyArray(snapshotUpdates) && isEmptyArray(categoryUpdates)) {
                return;
            }

            yield* Db.transaction(
                Effect.gen(function* () {
                    yield* Effect.forEach(snapshotUpdates, ({ id, input }) => budgetPeriodSnapshotRepository.updateSnapshot(id, input), {
                        discard: true
                    });
                    yield* Effect.forEach(
                        categoryUpdates,
                        ({ id, spent, carriedIn }) => budgetPeriodSnapshotRepository.updateCategorySnapshot(id, { spent, carriedIn }),
                        { discard: true }
                    );
                })
            );
        });

        const loadPriorConsumption = Effect.fnUntraced(function* (
            budget: Pick<BudgetEntityInterface, 'instrumentId' | 'syncZone'>,
            fund: BudgetSinkingFundEntityInterface,
            firstWindow: BudgetPeriodWindowInterface
        ) {
            const dueWindow = computeFundDueWindow(fund.dueAt);

            if (dueWindow.periodStart.getTime() >= firstWindow.periodStart.getTime()) {
                return 0;
            }

            const rows = yield* budgetRepository.findBudgetSpentEntries(
                dueWindow.periodStart,
                min([dueWindow.nextPeriodStart, firstWindow.periodStart]),
                budget.instrumentId,
                budget.syncZone
            );

            return matchFundSpend(toBudgetCurrencyEntries(rows, budget.instrumentId), [fund]).reduce(
                (total, draw) => total + draw.amount,
                0
            );
        });

        const settleClosedFund = (state: BudgetFundCloseStateInterface, closedThrough: Date): BudgetFundCloseStateInterface => {
            let { fundedAmount, dueAt } = state.fund;
            let { consumed } = state;

            for (let settlement = 0; settlement < maxFundSettlements; settlement += 1) {
                if (computeFundDueWindow(dueAt).nextPeriodStart.getTime() > closedThrough.getTime()) {
                    break;
                }

                fundedAmount = Math.max(fundedAmount - consumed, 0);
                consumed = 0;

                if (!isDefined(state.fund.repeatEveryMonths)) {
                    return { fund: { ...state.fund, fundedAmount, dueAt }, consumed, isFinished: true };
                }

                dueAt = addMonths(dueAt, state.fund.repeatEveryMonths);
            }

            return { fund: { ...state.fund, fundedAmount, dueAt }, consumed, isFinished: false };
        };

        const advanceFundsThroughWindow = (
            states: readonly BudgetFundCloseStateInterface[],
            budget: BudgetEntityInterface,
            window: BudgetPeriodWindowInterface,
            draws: readonly BudgetFundDrawInterface[]
        ) =>
            states.map(state => {
                if (state.isFinished) {
                    return state;
                }

                const contribution = contributeToFund(state.fund, [window], budget);
                const drawn = draws.filter(draw => draw.fundId === state.fund.id).reduce((total, draw) => total + draw.amount, 0);

                return settleClosedFund(
                    {
                        fund: { ...state.fund, ...contribution },
                        consumed: state.consumed + drawn,
                        isFinished: false
                    },
                    window.nextPeriodStart
                );
            });

        const persistFunds = Effect.fnUntraced(function* (
            originals: readonly BudgetSinkingFundEntityInterface[],
            states: readonly BudgetFundCloseStateInterface[]
        ) {
            const originalById = new Map(originals.map(original => [original.id, original]));

            yield* Effect.forEach(
                states,
                Effect.fnUntraced(function* ({ fund, isFinished }) {
                    const original = originalById.get(fund.id);

                    if (isFinished) {
                        yield* budgetSinkingFundRepository.delete(fund.id);

                        return;
                    }

                    const hasChanged =
                        fund.fundedAmount !== original?.fundedAmount ||
                        fund.dueAt.getTime() !== original.dueAt.getTime() ||
                        fund.lastFundedPeriodStart?.getTime() !== original.lastFundedPeriodStart?.getTime();

                    if (hasChanged) {
                        yield* budgetSinkingFundRepository.update(fund.id, {
                            fundedAmount: fund.fundedAmount,
                            dueAt: fund.dueAt,
                            lastFundedPeriodStart: fund.lastFundedPeriodStart
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
                min(history.map(snapshot => snapshot.periodStart))
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
            closeDuePeriods: Effect.fn('BudgetPeriodCloseService.closeDuePeriods')(function* (now: Date) {
                const budget = yield* budgetRepository.findMain;

                if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId)) {
                    return;
                }

                const recentSnapshots = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, refreshPeriodCount);
                const [latestSnapshot] = recentSnapshots;
                const latestPeriodStart = isDefined(latestSnapshot) ? latestSnapshot.periodStart : null;
                const earliestOperatedAt = yield* budgetRepository.findEarliestOperatedAt;
                const windows = computeClosedPeriods(budget, now, latestPeriodStart, earliestOperatedAt);

                if (isEmptyArray(windows)) {
                    yield* refreshRecentPeriods(budget, recentSnapshots);

                    return;
                }

                yield* Db.transaction(
                    Effect.gen(function* () {
                        const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
                        const snapshotPeriod = makeSnapshotPeriod(budget, categoryLimits, !isDefined(latestSnapshot));
                        const originalFunds = yield* budgetSinkingFundRepository.getByBudget(budget.id);
                        const [firstWindow] = windows;
                        const initialStates = yield* Effect.forEach(originalFunds, fund =>
                            Effect.map(loadPriorConsumption(budget, fund, firstWindow), consumed => ({
                                fund,
                                consumed,
                                isFinished: false
                            }))
                        );

                        const closed = yield* Effect.reduce(
                            windows,
                            () => ({ carryIn: computeSnapshotCarryOuts(latestSnapshot), states: initialStates }),
                            (accumulator, window) =>
                                Effect.map(
                                    snapshotPeriod(
                                        window,
                                        accumulator.carryIn,
                                        accumulator.states.filter(state => !state.isFinished).map(state => state.fund)
                                    ),
                                    ({ carryOuts, draws }) => ({
                                        carryIn: carryOuts,
                                        states: advanceFundsThroughWindow(accumulator.states, budget, window, draws)
                                    })
                                )
                        );

                        const updatedSnapshots = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, refreshPeriodCount);

                        yield* refreshRecentPeriods(budget, updatedSnapshots);
                        yield* persistFunds(originalFunds, closed.states);

                        const lastClosedWindow = windows.at(-1);

                        if (isDefined(lastClosedWindow)) {
                            yield* tuneLimits(budget, categoryLimits, lastClosedWindow, now);
                        }
                    })
                );
            })
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
