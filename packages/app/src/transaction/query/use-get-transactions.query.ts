import { TransactionViewRepository } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';

export const transactionsAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, [filters, language, limit]: readonly [TransactionFilterInterface, LanguageEnum, number]) =>
        transactionViewRepository.getAll(limit, filters, language)
);

export const useGetTransactionsQuery = (filters: TransactionFilterInterface, accountId: number | null) =>
    useGetTransactionSectionsQuery(
        (limit, language) => transactionsAtom([filters, language, limit]),
        buildTransactionFilterKey(filters),
        accountId
    );
