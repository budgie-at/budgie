import { DEFAULT_TRANSACTION_FILTER, StatisticsRepository, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const hasIncomeOrExpenseAtom = databaseQueryAtom(
    [TransactionEntityTable, TransactionEntryEntityTable],
    Effect.flatMap(StatisticsRepository, statisticsRepository =>
        statisticsRepository.hasIncomeOrExpenseQuery({ ...DEFAULT_TRANSACTION_FILTER, date: null })
    )
);

export const useHasIncomeOrExpenseQuery = () => {
    const result = useLiveAtomValue(hasIncomeOrExpenseAtom);

    return { hasIncomeOrExpense: isNotEmptyArray(AsyncResult.getOrElse(result, () => [])), isLoading: AsyncResult.isInitial(result) };
};
