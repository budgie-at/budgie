import { type SQL, type SQLWrapper, sql } from 'drizzle-orm';

import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';

class AccountBalanceDebtProgressSqlBuilder {
    getDebtProgressSql(balanceSql: SQL, debitAmountSql: SQL, creditAmountSql: SQL, targetAmountSql: SQL | SQLWrapper) {
        const balanceValueSql = sql<number>`(${balanceSql})`;
        const debitAmountValueSql = sql<number>`(${debitAmountSql})`;
        const creditAmountValueSql = sql<number>`(${creditAmountSql})`;
        const targetAmountValueSql = sql<number>`(${targetAmountSql})`;
        const closedAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${debitAmountValueSql} ELSE ${creditAmountValueSql} END`;
        const openedAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${creditAmountValueSql} ELSE ${debitAmountValueSql} END`;
        const signedOutstandingAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN 0 - ${balanceValueSql} ELSE ${balanceValueSql} END`;

        return this.getDebtProgressComputedSql(closedAmountSql, openedAmountSql, signedOutstandingAmountSql, targetAmountValueSql);
    }

    private getDebtProgressComputedSql(
        closedAmountSql: SQL<number>,
        openedAmountSql: SQL<number>,
        signedOutstandingAmountSql: SQL<number>,
        targetAmountSql: SQL<number>
    ) {
        const hasLedgerActivitySql = sql`(${openedAmountSql} > 0 OR ${closedAmountSql} > 0)`;
        const ledgerOutstandingAmountSql = sql<number>`MAX(${openedAmountSql} - ${closedAmountSql}, 0)`;
        const signedFallbackOutstandingAmountSql = sql<number>`CASE WHEN ${signedOutstandingAmountSql} > 0 THEN ${signedOutstandingAmountSql} ELSE 0 END`;
        const targetOnlyOutstandingAmountSql = sql<number>`CASE WHEN ${signedOutstandingAmountSql} = 0 THEN MAX(${targetAmountSql}, 0) ELSE 0 END`;
        const fallbackOutstandingAmountSql = sql<number>`MAX(${signedFallbackOutstandingAmountSql}, ${targetOnlyOutstandingAmountSql})`;
        const outstandingAmountSql = sql<number>`CASE WHEN ${hasLedgerActivitySql} THEN ${ledgerOutstandingAmountSql} ELSE ${fallbackOutstandingAmountSql} END`;
        const observedTotalAmountSql = sql<number>`CASE WHEN ${hasLedgerActivitySql} THEN MAX(${openedAmountSql}, ${closedAmountSql}, ${closedAmountSql} + ${outstandingAmountSql}) ELSE ${outstandingAmountSql} END`;
        const totalAmountSql = sql<number>`MAX(${targetAmountSql}, ${observedTotalAmountSql}, 0)`;
        const paidAmountSql = sql<number>`MIN(MAX(${totalAmountSql} - ${outstandingAmountSql}, 0), ${totalAmountSql})`;
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
}

export const accountBalanceDebtProgressSqlBuilder = new AccountBalanceDebtProgressSqlBuilder();
