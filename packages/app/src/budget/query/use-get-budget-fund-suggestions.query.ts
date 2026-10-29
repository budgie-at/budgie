import { BudgetSinkingFundEntityTable, ExchangeRateEntityTable, RecurringSeriesEntityTable, SettingsEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { BudgetFundSuggestionService } from '../service/budget-fund-suggestion.service';

import type { BudgetFundSuggestionInterface } from '../interface/budget-fund-suggestion.interface';

const EMPTY_SUGGESTIONS: readonly BudgetFundSuggestionInterface[] = [];

export const budgetFundSuggestionsAtom = databaseQueryFamily(
    [RecurringSeriesEntityTable, BudgetSinkingFundEntityTable, ExchangeRateEntityTable, SettingsEntityTable],
    BudgetFundSuggestionService,
    (budgetFundSuggestionService, key: readonly [number, number, number]) =>
        budgetFundSuggestionService.findSuggestions(key[0], key[1], new Date(key[2]))
);

export const useGetBudgetFundSuggestionsQuery = (budgetId: number, instrumentId: number): readonly BudgetFundSuggestionInterface[] => {
    const today = useToday();
    const result = useLiveAtomValue(budgetFundSuggestionsAtom([budgetId, instrumentId, new Date(today).setHours(0, 0, 0, 0)]));

    return AsyncResult.getOrElse(result, () => EMPTY_SUGGESTIONS);
};
