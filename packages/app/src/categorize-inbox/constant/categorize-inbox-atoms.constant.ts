import { TransactionCategorizeInboxRepository } from '@budgie/categorization';
import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import {
    AccountEntityTable,
    CategoryEntityTable,
    DebtEventEntityTable,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { TransactionFilterInterface } from '@budgie/contracts';

const INBOX_ROWS_TABLES = [
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable,
    AccountEntityTable,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    CategoryEntityTable,
    DebtEventEntityTable
];

export const uncategorizedRowsAtom = databaseQueryFamily(
    INBOX_ROWS_TABLES,
    TransactionCategorizeInboxRepository,
    (repository, filters: TransactionFilterInterface) => repository.findUncategorizedRows(filters)
);

export const untaggedRowsAtom = databaseQueryFamily(
    INBOX_ROWS_TABLES,
    TransactionCategorizeInboxRepository,
    (repository, filters: TransactionFilterInterface) => repository.findUntaggedRows(filters)
);

export const categoryEvidenceAtom = databaseQueryAtom(
    [TransactionEntityTable, TransactionEntryEntityTable, CategoryEntityTable],
    Effect.flatMap(TransactionCategorizeInboxRepository, repository => repository.findCategoryEvidence())
);

export const tagEvidenceAtom = databaseQueryAtom(
    [TransactionEntityTable, TransactionEntryEntityTable, TransactionTagsEntityTable],
    Effect.flatMap(TransactionCategorizeInboxRepository, repository => repository.findTagEvidence())
);

export const atmCashWithdrawalTransactionIdsAtom = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable, InstrumentEntityTable, MccCategoryEntityTable],
    ConsolidationCoordinatorService,
    (consolidationCoordinatorService, transactionIds: readonly number[]) =>
        consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds(transactionIds)
);
