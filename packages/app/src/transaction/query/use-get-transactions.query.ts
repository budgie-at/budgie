import { TransactionViewRepository } from '@budgie/contracts';
import * as Option from 'effect/Option';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

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

const getDayTotalsAccountIds = ({ types, categoryIds, tagIds, amount, accountIds }: TransactionFilterInterface) =>
    isNotEmptyArray(types) || isDefined(categoryIds) || isDefined(tagIds) || isDefined(amount)
        ? Option.none()
        : Option.some(isNotEmptyArray(accountIds) ? accountIds : null);

export const useGetTransactionsQuery = (filters: TransactionFilterInterface) =>
    useGetTransactionSectionsQuery(
        (limit, language) => transactionsAtom([filters, language, limit]),
        buildTransactionFilterKey(filters),
        getDayTotalsAccountIds(filters)
    );
