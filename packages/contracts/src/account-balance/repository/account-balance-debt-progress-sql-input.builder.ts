import { sql } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { DebtEventDirectionEnum } from '../../debt-event/enum/debt-event-direction.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';

import type { AccountBalanceDebtProgressSqlInputBuilderParamsInterface } from '../interface/account-balance-debt-progress-sql-input-builder-params.interface';
import type { AccountBalanceDebtProgressSqlInputInterface } from '../interface/account-balance-debt-progress-sql-input.interface';

class AccountBalanceDebtProgressSqlInputBuilder {
    build(input: AccountBalanceDebtProgressSqlInputBuilderParamsInterface): AccountBalanceDebtProgressSqlInputInterface {
        const { targetAmountSql } = input;

        return {
            closedAmountSql: this.getDebtEventAmountSumSql(input, DebtEventDirectionEnum.CLOSE),
            openedAmountSql: this.getOpenedAmountSql(input),
            targetAmountSql
        };
    }

    private getOpenedAmountSql(input: AccountBalanceDebtProgressSqlInputBuilderParamsInterface) {
        const eventOpenedAmountSql = this.getDebtEventAmountSumSql(input, DebtEventDirectionEnum.OPEN);

        return sql<number>`CASE WHEN (${eventOpenedAmountSql}) > 0 THEN (${eventOpenedAmountSql}) ELSE (${input.targetAmountSql}) END`;
    }

    private getDebtEventAmountSumSql(input: AccountBalanceDebtProgressSqlInputBuilderParamsInterface, direction: DebtEventDirectionEnum) {
        const { accountIdReference } = input;
        const amountSql = this.getDebtEventAmountSql(input);

        return sql<number>`SELECT COALESCE(SUM(${amountSql}), 0) FROM ${DebtEventEntityTable} WHERE ${DebtEventEntityTable.debtAccountId} = ${accountIdReference} AND ${DebtEventEntityTable.deletedAt} IS NULL AND ${DebtEventEntityTable.direction} = ${direction}`;
    }

    private getDebtEventAmountSql(input: AccountBalanceDebtProgressSqlInputBuilderParamsInterface) {
        const { baseInstrumentId, exchangeRateSql } = input;

        if (!isDefined(exchangeRateSql) || !isDefined(baseInstrumentId)) {
            return sql<number>`${DebtEventEntityTable.amount}`;
        }

        return sql<number>`
            CASE
                WHEN ${DebtEventEntityTable.baseInstrumentId} = ${baseInstrumentId}
                     AND ${DebtEventEntityTable.baseAmount} IS NOT NULL
                THEN ${DebtEventEntityTable.baseAmount}
                ELSE COALESCE(${DebtEventEntityTable.amount} * ${exchangeRateSql}, 0)
            END
        `;
    }
}

export const accountBalanceDebtProgressSqlInputBuilder = new AccountBalanceDebtProgressSqlInputBuilder();
