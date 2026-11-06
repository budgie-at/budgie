import {
    AccountEntityTable,
    BankIntegrationEntityTable,
    SyncEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { InzhurManualPurchaseService } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { inzhurDismissedTopUpsAtom } from '../constant/inzhur-dismissed-top-ups-atom.constant';

const inzhurPendingTopUpsAtom = databaseQueryAtom(
    [AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    Effect.flatMap(InzhurManualPurchaseService, inzhurManualPurchaseService => inzhurManualPurchaseService.findPendingTopUps())
);

export const useInzhurPendingTopUpsQuery = () => {
    const pendingTopUps = AsyncResult.getOrElse(useLiveAtomValue(inzhurPendingTopUpsAtom), () => []);
    const dismissedIds = useAtomValue(inzhurDismissedTopUpsAtom);

    return pendingTopUps
        .filter(topUp => !dismissedIds.includes(topUp.transactionId))
        .sort((first, second) => second.operatedAt.getTime() - first.operatedAt.getTime());
};
