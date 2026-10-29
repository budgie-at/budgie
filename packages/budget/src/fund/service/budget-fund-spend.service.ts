import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import { BudgetRepository } from '../../query/repository/budget.repository';
import { toBudgetCurrencyEntries } from '../../spent/utils/to-budget-currency-entries.util';
import { BudgetSinkingFundRepository } from '../repository/budget-sinking-fund.repository';
import { applyFundDraws } from '../utils/apply-fund-draws.util';
import { computeFundDueWindow } from '../utils/compute-fund-due-window.util';
import { matchFundSpend } from '../utils/match-fund-spend.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

export class BudgetFundSpendService extends Context.Service<BudgetFundSpendService>()('@budgie/budget/BudgetFundSpendService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;

        const findSpentWithDraws = Effect.fn('BudgetFundSpendService.findSpentWithDraws')(function* (
            budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>,
            periodStart: Date,
            nextPeriodStart: Date
        ) {
            const funds = yield* budgetSinkingFundRepository.getByBudget(budget.id);
            const dueWindows = funds.map(fund => computeFundDueWindow(fund.dueAt));
            const rangeStart = Math.min(periodStart.getTime(), ...dueWindows.map(dueWindow => dueWindow.periodStart.getTime()));
            const rangeEnd = Math.max(nextPeriodStart.getTime(), ...dueWindows.map(dueWindow => dueWindow.nextPeriodStart.getTime()));
            const rangeRows = yield* budgetRepository.findBudgetSpentEntries(new Date(rangeStart), new Date(rangeEnd), budget.instrumentId);
            const rangeEntries = toBudgetCurrencyEntries(rangeRows, budget.instrumentId);
            const entries = rangeEntries.filter(
                entry => entry.operatedAt.getTime() >= periodStart.getTime() && entry.operatedAt.getTime() < nextPeriodStart.getTime()
            );

            if (isEmptyArray(funds)) {
                return { entries, draws: [] };
            }

            const periodEntryIds = new Set(entries.map(entry => entry.entryId));

            return { entries, draws: matchFundSpend(rangeEntries, funds).filter(draw => periodEntryIds.has(draw.entryId)) };
        });

        return {
            findSpentWithDraws,
            findSpentEntries: Effect.fn('BudgetFundSpendService.findSpentEntries')(function* (
                budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>,
                periodStart: Date,
                nextPeriodStart: Date
            ) {
                const { entries, draws } = yield* findSpentWithDraws(budget, periodStart, nextPeriodStart);

                return applyFundDraws(entries, draws);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetFundSpendService, BudgetFundSpendService.make).pipe(
        Layer.provide([BudgetRepository.layer, BudgetSinkingFundRepository.layer])
    );
}
