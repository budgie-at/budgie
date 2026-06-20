import { type SQL, sql } from 'drizzle-orm';

import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';

import type { AccountBalanceDebtProgressComputedSqlInputInterface } from '../interface/account-balance-debt-progress-computed-sql-input.interface';
import type { AccountBalanceDebtProgressSqlInputInterface } from '../interface/account-balance-debt-progress-sql-input.interface';

class AccountBalanceDebtProgressSqlBuilder {
    getDebtProgressSql(input: AccountBalanceDebtProgressSqlInputInterface) {
        return this.getDebtProgressComputedSql(this.getDebtProgressComputedInput(input));
    }

    getDebtProgressSelectSql(input: AccountBalanceDebtProgressSqlInputInterface) {
        const debtProgressSql = this.getDebtProgressSql(input);

        return {
            closedAmount: debtProgressSql.closedAmount,
            creditAmount: sql<number>`(${input.creditSettlementAmountSql})`.mapWith(Number),
            debitAmount: sql<number>`(${input.debitSettlementAmountSql})`.mapWith(Number),
            openedAmount: debtProgressSql.openedAmount,
            outstandingAmount: debtProgressSql.outstandingAmount,
            paidAmount: debtProgressSql.paidAmount,
            percentage: debtProgressSql.percentage,
            totalAmount: debtProgressSql.totalAmount
        };
    }

    private getNormalizedDebtProgressSqlInput(input: AccountBalanceDebtProgressSqlInputInterface) {
        const {
            adjustmentCreditAmountSql,
            adjustmentDebitAmountSql,
            debtPrimaryCreditAmountSql,
            debtPrimaryDebitAmountSql,
            debitSettlementAmountSql,
            creditSettlementAmountSql,
            targetAmountSql
        } = input;
        const adjustmentDebitAmountValueSql = sql<number>`(${adjustmentDebitAmountSql})`;
        const adjustmentCreditAmountValueSql = sql<number>`(${adjustmentCreditAmountSql})`;
        const adjustmentBalanceValueSql = sql<number>`${adjustmentDebitAmountValueSql} - ${adjustmentCreditAmountValueSql}`;
        const debtPrimaryDebitAmountValueSql = sql<number>`(${debtPrimaryDebitAmountSql})`;
        const debtPrimaryCreditAmountValueSql = sql<number>`(${debtPrimaryCreditAmountSql})`;
        const debitSettlementAmountValueSql = sql<number>`(${debitSettlementAmountSql})`;
        const creditSettlementAmountValueSql = sql<number>`(${creditSettlementAmountSql})`;
        const targetAmountValueSql = sql<number>`(${targetAmountSql})`;

        return {
            adjustmentBalanceValueSql,
            creditSettlementAmountValueSql,
            debitSettlementAmountValueSql,
            debtPrimaryCreditAmountValueSql,
            debtPrimaryDebitAmountValueSql,
            targetAmountValueSql
        };
    }

    private getDebtProgressComputedInput(input: AccountBalanceDebtProgressSqlInputInterface) {
        const {
            adjustmentBalanceValueSql,
            creditSettlementAmountValueSql,
            debitSettlementAmountValueSql,
            debtPrimaryCreditAmountValueSql,
            debtPrimaryDebitAmountValueSql,
            targetAmountValueSql
        } = this.getNormalizedDebtProgressSqlInput(input);
        const initialClosedAmountSql = this.getInitialClosedAmountSql(adjustmentBalanceValueSql, targetAmountValueSql);
        const initialOutstandingAmountSql = this.getInitialOutstandingAmountSql(adjustmentBalanceValueSql);
        const closedMovementAmountSql = this.getClosedMovementAmountSql(
            debtPrimaryDebitAmountValueSql,
            debitSettlementAmountValueSql,
            debtPrimaryCreditAmountValueSql,
            creditSettlementAmountValueSql
        );
        const openedPrincipalAmountSql = this.getOpenedPrincipalAmountSql(debtPrimaryCreditAmountValueSql, debtPrimaryDebitAmountValueSql);
        const openedExtraAmountSql = this.getOpenedExtraAmountSql(creditSettlementAmountValueSql, debitSettlementAmountValueSql);

        return {
            initialClosedAmountSql,
            initialOutstandingAmountSql,
            closedMovementAmountSql,
            openedExtraAmountSql,
            openedPrincipalAmountSql,
            targetAmountSql: targetAmountValueSql
        };
    }

    private getInitialClosedAmountSql(adjustmentBalanceValueSql: SQL<number>, targetAmountValueSql: SQL<number>) {
        return sql<number>`
            CASE
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.LENT} AND ${adjustmentBalanceValueSql} > 0 THEN ${adjustmentBalanceValueSql}
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.LENT} AND ${adjustmentBalanceValueSql} < 0 THEN ${targetAmountValueSql}
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} AND ${adjustmentBalanceValueSql} > 0 THEN ${adjustmentBalanceValueSql}
                ELSE 0
            END
        `;
    }

    private getInitialOutstandingAmountSql(adjustmentBalanceValueSql: SQL<number>) {
        return sql<number>`
            CASE
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} AND ${adjustmentBalanceValueSql} < 0 THEN 0 - ${adjustmentBalanceValueSql}
                ELSE 0
            END
        `;
    }

    private getClosedMovementAmountSql(
        debtPrimaryDebitAmountValueSql: SQL<number>,
        debitSettlementAmountValueSql: SQL<number>,
        debtPrimaryCreditAmountValueSql: SQL<number>,
        creditSettlementAmountValueSql: SQL<number>
    ) {
        return sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${debtPrimaryDebitAmountValueSql} + ${debitSettlementAmountValueSql} ELSE ${debtPrimaryCreditAmountValueSql} + ${creditSettlementAmountValueSql} END`;
    }

    private getOpenedPrincipalAmountSql(debtPrimaryCreditAmountValueSql: SQL<number>, debtPrimaryDebitAmountValueSql: SQL<number>) {
        return sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${debtPrimaryCreditAmountValueSql} ELSE ${debtPrimaryDebitAmountValueSql} END`;
    }

    private getOpenedExtraAmountSql(creditSettlementAmountValueSql: SQL<number>, debitSettlementAmountValueSql: SQL<number>) {
        return sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${creditSettlementAmountValueSql} ELSE ${debitSettlementAmountValueSql} END`;
    }

    private getDebtProgressComputedSql(input: AccountBalanceDebtProgressComputedSqlInputInterface) {
        const {
            initialClosedAmountSql,
            initialOutstandingAmountSql,
            closedMovementAmountSql,
            openedExtraAmountSql,
            openedPrincipalAmountSql,
            targetAmountSql
        } = input;
        const closedAmountSql = sql<number>`MAX(${initialClosedAmountSql} + ${closedMovementAmountSql}, 0)`;
        const baselineAmountSql = sql<number>`MAX(${targetAmountSql}, ${initialOutstandingAmountSql})`;
        const effectiveDebtBasisAmountSql = sql<number>`MAX(${baselineAmountSql} + ${openedPrincipalAmountSql} + ${openedExtraAmountSql}, 0)`;
        const totalAmountSql = sql<number>`MAX(${effectiveDebtBasisAmountSql}, ${closedAmountSql}, 0)`;
        const outstandingAmountSql = sql<number>`MAX(${effectiveDebtBasisAmountSql} - ${closedAmountSql}, 0)`;
        const paidAmountSql = sql<number>`MAX(${totalAmountSql} - ${outstandingAmountSql}, 0)`;
        const percentageSql = sql<number>`CASE WHEN ${totalAmountSql} > 0 THEN MIN(ROUND((${paidAmountSql} * 100.0) / ${totalAmountSql}, 2), 100) ELSE 0 END`;

        return {
            closedAmount: closedAmountSql.mapWith(Number),
            openedAmount: sql<number>`${openedPrincipalAmountSql} + ${openedExtraAmountSql}`.mapWith(Number),
            outstandingAmount: outstandingAmountSql.mapWith(Number),
            paidAmount: paidAmountSql.mapWith(Number),
            percentage: percentageSql.mapWith(Number),
            totalAmount: totalAmountSql.mapWith(Number)
        };
    }
}

export const accountBalanceDebtProgressSqlBuilder = new AccountBalanceDebtProgressSqlBuilder();
