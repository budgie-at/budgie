import { DEFAULT_TRANSACTION_FILTER, LanguageEnum, StatisticsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const fetchDefaultStatistics = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1);
    const incomeByCategory = yield* statisticsRepository.getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, 1, LanguageEnum.EN);
    const expenseByCategory = yield* statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, 1, LanguageEnum.EN);
    const incomeTransactions = yield* statisticsRepository.getIncomeTransactionsQuery(DEFAULT_TRANSACTION_FILTER);
    const expenseTransactions = yield* statisticsRepository.getExpenseTransactionsQuery(DEFAULT_TRANSACTION_FILTER);

    return { totals, incomeByCategory, expenseByCategory, incomeTransactions, expenseTransactions };
});
