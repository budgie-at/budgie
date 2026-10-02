import { TransactionViewRepository } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';

const uncategorizedTransactionsAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, [filters, language, limit]: readonly [TransactionFilterInterface, LanguageEnum, number]) =>
        transactionViewRepository.getUncategorized(limit, filters, language)
);

export const useGetUncategorizedTransactionsQuery = (filters: TransactionFilterInterface) =>
    useGetTransactionSectionsQuery(
        (limit, language) => uncategorizedTransactionsAtom([filters, language, limit]),
        buildTransactionFilterKey(filters)
    );
