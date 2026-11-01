import { DEFAULT_TRANSACTION_FILTER, StatisticsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { TRANSACTION_FILTER_TABLES } from '../constant/transaction-filter-tables.constant';

const hasIncomeOrExpenseAtom = databaseQueryAtom(
    TRANSACTION_FILTER_TABLES,
    Effect.flatMap(StatisticsRepository, statisticsRepository =>
        statisticsRepository.hasIncomeOrExpenseQuery({ ...DEFAULT_TRANSACTION_FILTER, date: null })
    )
);

export const useHasIncomeOrExpenseQuery = () => {
    const result = useLiveAtomValue(hasIncomeOrExpenseAtom);

    return { hasIncomeOrExpense: isNotEmptyArray(AsyncResult.getOrElse(result, () => [])), isLoading: AsyncResult.isInitial(result) };
};
