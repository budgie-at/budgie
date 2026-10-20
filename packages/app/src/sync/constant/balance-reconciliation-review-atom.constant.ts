import { SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { SyncBalanceReconciliationService } from '@budgie/sync';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const balanceReconciliationReviewAtom = databaseQueryFamily(
    [SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    SyncBalanceReconciliationService,
    (syncBalanceReconciliationService, accountId: number) => syncBalanceReconciliationService.getPendingReview(accountId)
);
