import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../@generic/drizzle/db/db';
import { TransactionEntityTable, TransactionEntryEntityTable } from '../../@generic/drizzle/db/schema';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

const buildDebtAccountLedgerTotalsQuery = (accountId: number) => {
    const debitAmountSql = sql<number>`
        COALESCE(SUM(CASE
            WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE 0
        END), 0)
    `.mapWith(Number);
    const creditAmountSql = sql<number>`
        COALESCE(SUM(CASE
            WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE 0
        END), 0)
    `.mapWith(Number);

    const balanceLedgerEntryConditionSql = sql`
        (
            ${TransactionEntryEntityTable.originalTransactionId} IS NULL
            OR ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
        )
    `;

    return db
        .select({
            debitAmount: debitAmountSql,
            creditAmount: creditAmountSql
        })
        .from(TransactionEntryEntityTable)
        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
        .where(
            and(
                eq(TransactionEntryEntityTable.accountId, accountId),
                isNull(TransactionEntryEntityTable.deletedAt),
                isNull(TransactionEntityTable.deletedAt),
                isNull(TransactionEntityTable.consolidationParentTransactionId),
                balanceLedgerEntryConditionSql
            )
        )
        .limit(1);
};

export const useDebtAccountLedgerTotalsQuery = (accountId: number) => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const { data } = useLiveQuery(buildDebtAccountLedgerTotalsQuery(accountId), [accountId, accountBalancesUpdatedAt]);
    const row = data.at(0);
    const debitAmount = useCachedMicroUnitQuery(row?.debitAmount);
    const creditAmount = useCachedMicroUnitQuery(row?.creditAmount);

    return { debitAmount, creditAmount };
};
