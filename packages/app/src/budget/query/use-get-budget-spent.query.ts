import { budgetPeriodService, BudgetRepository, BudgetSpentService } from '@budgie/budget';
import { AccountEntityTable, ExchangeRateEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetSpentResult {
    readonly spent: BudgetSpentInterface;
    readonly isLoading: boolean;
}

const EMPTY_SPENT: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [] };

const budgetSpentAtom = Atom.family(
    (key: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth' | 'instrumentId'> & { readonly dayStart: number }) =>
        databaseQueryAtom(
            [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, ExchangeRateEntityTable],
            Effect.gen(function* () {
                const budgetRepository = yield* BudgetRepository;
                const budgetSpentService = yield* BudgetSpentService;
                const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
                    key.periodStartDay,
                    key.useLastDayOfMonth,
                    new Date(key.dayStart)
                );
                const entries = yield* budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, key.instrumentId);

                return budgetSpentService.computeSpent(entries, key.instrumentId);
            })
        )
);

export const useGetBudgetSpentQuery = (budget: BudgetEntityInterface | null): UseGetBudgetSpentResult => {
    const today = useToday();
    const result = useLiveAtomValue(
        budgetSpentAtom({
            periodStartDay: isDefined(budget) ? budget.periodStartDay : 1,
            useLastDayOfMonth: isDefined(budget) ? budget.useLastDayOfMonth : false,
            instrumentId: isDefined(budget) ? budget.instrumentId : 0,
            dayStart: new Date(today).setHours(0, 0, 0, 0)
        })
    );

    if (!isDefined(budget) || AsyncResult.isInitial(result)) {
        return { spent: EMPTY_SPENT, isLoading: true };
    }

    if (!isPositiveNumber(budget.instrumentId)) {
        return { spent: EMPTY_SPENT, isLoading: false };
    }

    return { spent: AsyncResult.getOrElse(result, () => EMPTY_SPENT), isLoading: false };
};
