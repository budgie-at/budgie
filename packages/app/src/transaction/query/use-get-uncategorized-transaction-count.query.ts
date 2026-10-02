import { TransactionFilterInterface, TransactionViewRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';

const uncategorizedTransactionCountAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, filters: TransactionFilterInterface) => transactionViewRepository.countUncategorized(filters)
);

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const result = useLiveAtomValue(uncategorizedTransactionCountAtom(filters));
    const row = AsyncResult.getOrElse(result, () => []).at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;

    return {
        count: income + expense,
        isLoading: AsyncResult.isInitial(result)
    };
};
