import { sql } from 'drizzle-orm';

import type { AccountBalanceDebtProgressSqlInputInterface } from '../interface/account-balance-debt-progress-sql-input.interface';

class AccountBalanceDebtProgressSqlBuilder {
    getDebtProgressSql(input: AccountBalanceDebtProgressSqlInputInterface) {
        const openedAmountSql = sql<number>`MAX((${input.openedAmountSql}), 0)`;
        const closedAmountSql = sql<number>`MAX((${input.closedAmountSql}), 0)`;
        const outstandingAmountSql = sql<number>`MAX(${openedAmountSql} - ${closedAmountSql}, 0)`;
        const overpaidAmountSql = sql<number>`MAX(${closedAmountSql} - ${openedAmountSql}, 0)`;
        const percentageSql = sql<number>`CASE WHEN ${openedAmountSql} > 0 THEN MIN(ROUND((${closedAmountSql} * 100.0) / ${openedAmountSql}, 2), 100) ELSE 0 END`;

        return {
            outstandingAmount: outstandingAmountSql.mapWith(Number),
            overpaidAmount: overpaidAmountSql.mapWith(Number),
            paidAmount: closedAmountSql.mapWith(Number),
            percentage: percentageSql.mapWith(Number),
            totalAmount: openedAmountSql.mapWith(Number)
        };
    }
}

export const accountBalanceDebtProgressSqlBuilder = new AccountBalanceDebtProgressSqlBuilder();
