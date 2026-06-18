import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

import type { DebtAccountProgressSummaryInterface } from '../interface/debt-account-progress-summary.interface';

const EMPTY_DEBT_ACCOUNT_PROGRESS_SUMMARY: DebtAccountProgressSummaryInterface = {
    closedAmount: 0,
    creditAmount: 0,
    debitAmount: 0,
    openedAmount: 0,
    outstandingAmount: 0,
    paidAmount: 0,
    percentage: 0,
    totalAmount: 0
};

export const useDebtAccountProgressSummaryQuery = (accountId: number): DebtAccountProgressSummaryInterface => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const { data } = useLiveQuery(accountBalanceRepository.getDebtAccountProgressByAccountId(accountId), [
        accountId,
        accountBalancesUpdatedAt
    ]);
    const row = data.at(0);
    const closedAmount = useCachedMicroUnitQuery(row?.closedAmount);
    const creditAmount = useCachedMicroUnitQuery(row?.creditAmount);
    const debitAmount = useCachedMicroUnitQuery(row?.debitAmount);
    const openedAmount = useCachedMicroUnitQuery(row?.openedAmount);
    const outstandingAmount = useCachedMicroUnitQuery(row?.outstandingAmount);
    const paidAmount = useCachedMicroUnitQuery(row?.paidAmount);
    const totalAmount = useCachedMicroUnitQuery(row?.totalAmount);

    if (!isDefined(row)) {
        return EMPTY_DEBT_ACCOUNT_PROGRESS_SUMMARY;
    }

    return {
        closedAmount,
        creditAmount,
        debitAmount,
        openedAmount,
        outstandingAmount,
        paidAmount,
        percentage: row.percentage,
        totalAmount
    };
};
