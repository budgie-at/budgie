import { DebtEventEntityTable, DebtEventRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

const debtAccountManualSettledAmountAtom = databaseQueryFamily(
    [DebtEventEntityTable],
    DebtEventRepository,
    (debtEventRepository, accountId: number) => debtEventRepository.getManualSettledAmountByAccountId(accountId)
);

export const useDebtAccountManualSettledAmountQuery = (accountId: number): number => {
    const result = useLiveAtomValue(debtAccountManualSettledAmountAtom(accountId));

    return useCachedMicroUnitQuery(AsyncResult.getOrElse(result, () => []).at(0)?.amount);
};
