import { debtEventRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useDebtAccountManualSettledAmountQuery = (accountId: number): number => {
    const { data } = useDatabaseLiveQuery(debtEventRepository.getManualSettledAmountByAccountId(accountId), [accountId]);

    return useCachedMicroUnitQuery(data.at(0)?.amount);
};
