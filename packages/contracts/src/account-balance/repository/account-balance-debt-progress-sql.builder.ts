import { sql } from 'drizzle-orm';

import type { AccountBalanceDebtProgressSqlInputInterface } from '../interface/account-balance-debt-progress-sql-input.interface';

class AccountBalanceDebtProgressSqlBuilder {
    getDebtProgressSql(input: AccountBalanceDebtProgressSqlInputInterface) {
        const openedAmountSql = sql<number>`MAX((${input.openedAmountSql}), 0)`;
        const closedAmountSql = sql<number>`MAX((${input.closedAmountSql}), 0)`;
        const totalAmountSql = sql<number>`MAX(${openedAmountSql}, ${closedAmountSql}, 0)`;
        const outstandingAmountSql = sql<number>`MAX(${totalAmountSql} - ${closedAmountSql}, 0)`;
        const paidAmountSql = sql<number>`MIN(${closedAmountSql}, ${totalAmountSql})`;
        const percentageSql = sql<number>`CASE WHEN ${totalAmountSql} > 0 THEN MIN(ROUND((${paidAmountSql} * 100.0) / ${totalAmountSql}, 2), 100) ELSE 0 END`;

        return {
            closedAmount: closedAmountSql.mapWith(Number),
            openedAmount: openedAmountSql.mapWith(Number),
            outstandingAmount: outstandingAmountSql.mapWith(Number),
            paidAmount: paidAmountSql.mapWith(Number),
            percentage: percentageSql.mapWith(Number),
            totalAmount: totalAmountSql.mapWith(Number)
        };
    }

    getDebtProgressSelectSql(input: AccountBalanceDebtProgressSqlInputInterface) {
        const debtProgressSql = this.getDebtProgressSql(input);

        return {
            closedAmount: debtProgressSql.closedAmount,
            creditAmount: debtProgressSql.closedAmount,
            debitAmount: debtProgressSql.openedAmount,
            openedAmount: debtProgressSql.openedAmount,
            outstandingAmount: debtProgressSql.outstandingAmount,
            paidAmount: debtProgressSql.paidAmount,
            percentage: debtProgressSql.percentage,
            totalAmount: debtProgressSql.totalAmount
        };
    }
}

export const accountBalanceDebtProgressSqlBuilder = new AccountBalanceDebtProgressSqlBuilder();
