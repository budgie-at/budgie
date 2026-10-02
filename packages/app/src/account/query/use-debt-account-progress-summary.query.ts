import { AccountBalanceRepository, AccountEntityTable, DebtEventEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

const EMPTY_DEBT_ACCOUNT_PROGRESS_SUMMARY: DebtAccountProgressSummaryInterface = {
    outstandingAmount: 0,
    overpaidAmount: 0,
    paidAmount: 0,
    percentage: 0,
    totalAmount: 0
};

const debtAccountProgressAtom = databaseQueryFamily(
    [AccountEntityTable, DebtEventEntityTable],
    AccountBalanceRepository,
    (accountBalanceRepository, accountId: number) => accountBalanceRepository.getDebtAccountProgressByAccountId(accountId)
);

export const useDebtAccountProgressSummaryQuery = (accountId: number): DebtAccountProgressSummaryInterface | null => {
    const result = useLiveAtomValue(debtAccountProgressAtom(accountId));
    const row = AsyncResult.getOrElse(result, () => []).at(0);
    const outstandingAmount = useCachedMicroUnitQuery(row?.outstandingAmount);
    const overpaidAmount = useCachedMicroUnitQuery(row?.overpaidAmount);
    const paidAmount = useCachedMicroUnitQuery(row?.paidAmount);
    const totalAmount = useCachedMicroUnitQuery(row?.totalAmount);

    if (AsyncResult.isInitial(result)) {
        return null;
    }

    if (!isDefined(row)) {
        return EMPTY_DEBT_ACCOUNT_PROGRESS_SUMMARY;
    }

    return {
        outstandingAmount,
        overpaidAmount,
        paidAmount,
        percentage: row.percentage,
        totalAmount
    };
};
