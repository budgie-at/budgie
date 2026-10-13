import { DEFAULT_TRANSACTION_FILTER, StatisticsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const fetchTotalExpense = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;

    return (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1)).at(0)?.expense ?? 0;
});
