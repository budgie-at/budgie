import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

const EMPTY_DEBT_ACCOUNT_PROGRESS_SUMMARY: DebtAccountProgressSummaryInterface = {
    outstandingAmount: 0,
    overpaidAmount: 0,
    paidAmount: 0,
    percentage: 0,
    totalAmount: 0
};

export const useDebtAccountProgressSummaryQuery = (accountId: number): DebtAccountProgressSummaryInterface => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const { data } = useDatabaseLiveQuery(accountBalanceRepository.getDebtAccountProgressByAccountId(accountId), [
        accountId,
        accountBalancesUpdatedAt
    ]);
    const row = data.at(0);
    const outstandingAmount = useCachedMicroUnitQuery(row?.outstandingAmount);
    const overpaidAmount = useCachedMicroUnitQuery(row?.overpaidAmount);
    const paidAmount = useCachedMicroUnitQuery(row?.paidAmount);
    const totalAmount = useCachedMicroUnitQuery(row?.totalAmount);

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
