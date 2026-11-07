import {
    AccountEntityTable,
    BankIntegrationEntityTable,
    SyncEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { InzhurManualPurchaseService } from '@budgie/sync';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const inzhurTopUpFamily = databaseQueryFamily(
    [AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    InzhurManualPurchaseService,
    (inzhurManualPurchaseService, topUpTransactionId: number) => inzhurManualPurchaseService.findTopUp(topUpTransactionId)
);

export const useInzhurTopUpQuery = (topUpTransactionId: number) => {
    const result = useLiveAtomValue(inzhurTopUpFamily(topUpTransactionId));

    return { topUp: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
