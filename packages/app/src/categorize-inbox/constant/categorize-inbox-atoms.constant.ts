import { TransactionCategorizeInboxRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const uncategorizedRowsAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionCategorizeInboxRepository,
    (repository, filters: TransactionFilterInterface) => repository.findUncategorizedRows(filters)
);

export const untaggedRowsAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionCategorizeInboxRepository,
    (repository, filters: TransactionFilterInterface) => repository.findUntaggedRows(filters)
);

export const categoryEvidenceAtom = databaseQueryAtom(
    TRANSACTION_LIST_TABLES,
    Effect.flatMap(TransactionCategorizeInboxRepository, repository => repository.findCategoryEvidence())
);

export const tagEvidenceAtom = databaseQueryAtom(
    TRANSACTION_LIST_TABLES,
    Effect.flatMap(TransactionCategorizeInboxRepository, repository => repository.findTagEvidence())
);
