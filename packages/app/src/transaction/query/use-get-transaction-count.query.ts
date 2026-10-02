import { TransactionFilterInterface, TransactionViewRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';

const transactionCountAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, filters: TransactionFilterInterface) => transactionViewRepository.countAll(filters)
);

export const useGetTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const result = useLiveAtomValue(transactionCountAtom(filters));

    return {
        count: AsyncResult.getOrElse(result, () => []).at(0)?.value ?? 0,
        isLoading: AsyncResult.isInitial(result)
    };
};
