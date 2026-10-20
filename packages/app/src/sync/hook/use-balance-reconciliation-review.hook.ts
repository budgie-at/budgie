import { SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { SyncBalanceReconciliationService } from '@budgie/sync';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const balanceReconciliationReviewAtom = databaseQueryFamily(
    [SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    SyncBalanceReconciliationService,
    (syncBalanceReconciliationService, accountId: number) => syncBalanceReconciliationService.getPendingReview(accountId)
);

export const useBalanceReconciliationReview = (accountId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(balanceReconciliationReviewAtom(accountId)), () => null);
