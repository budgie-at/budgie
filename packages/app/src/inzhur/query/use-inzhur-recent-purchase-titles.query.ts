import { AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, TransactionEntityTable } from '@budgie/contracts';
import { InzhurManualPurchaseService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const inzhurRecentPurchaseTitlesAtom = databaseQueryAtom(
    [AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, TransactionEntityTable],
    Effect.flatMap(InzhurManualPurchaseService, service => service.findFundTitlesByRecentPurchase())
);

export const useInzhurRecentPurchaseTitlesQuery = () => {
    const result = useLiveAtomValue(inzhurRecentPurchaseTitlesAtom);

    return { titles: AsyncResult.getOrElse(result, (): readonly string[] => []), isLoading: AsyncResult.isInitial(result) };
};
