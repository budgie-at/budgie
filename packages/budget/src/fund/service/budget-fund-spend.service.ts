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
            const periodRows = yield* budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId);
            const entries = toBudgetCurrencyEntries(periodRows, budget.instrumentId);
            const funds = yield* budgetSinkingFundRepository.getByBudget(budget.id);

            if (isEmptyArray(funds)) {
                return { entries, draws: [] };
            }

            const dueWindowRows = yield* Effect.forEach(funds, fund => {
                const dueWindow = computeFundDueWindow(fund.dueAt);

                return budgetRepository.findBudgetSpentEntries(dueWindow.periodStart, dueWindow.nextPeriodStart, budget.instrumentId);
            });
            const dueWindowEntries = [
                ...new Map(toBudgetCurrencyEntries(dueWindowRows.flat(), budget.instrumentId).map(entry => [entry.entryId, entry])).values()
            ];
            const periodEntryIds = new Set(entries.map(entry => entry.entryId));

            return { entries, draws: matchFundSpend(dueWindowEntries, funds).filter(draw => periodEntryIds.has(draw.entryId)) };
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
