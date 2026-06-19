import { sql } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';

import { accountBalanceLedgerSqlBuilder } from './account-balance-ledger-sql.builder';

import type { AccountBalanceDebtProgressEntryAmountSqlParamsInterface } from '../interface/account-balance-debt-progress-entry-amount-sql-params.interface';
import type { AccountBalanceDebtProgressSqlInputBuilderParamsInterface } from '../interface/account-balance-debt-progress-sql-input-builder-params.interface';
import type { AccountBalanceDebtProgressSqlInputInterface } from '../interface/account-balance-debt-progress-sql-input.interface';

class AccountBalanceDebtProgressSqlInputBuilder {
    build(input: AccountBalanceDebtProgressSqlInputBuilderParamsInterface): AccountBalanceDebtProgressSqlInputInterface {
        const { accountIdReference, baseInstrumentId, exchangeRateSql, targetAmountSql } = input;

        return {
            adjustmentCreditAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.PRIMARY,
                transactionEntryType: TransactionEntryTypeEnum.CREDIT,
                transactionType: TransactionTypeEnum.ADJUSTMENT
            }),
            adjustmentDebitAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.PRIMARY,
                transactionEntryType: TransactionEntryTypeEnum.DEBIT,
                transactionType: TransactionTypeEnum.ADJUSTMENT
            }),
            creditSettlementAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
                transactionEntryType: TransactionEntryTypeEnum.CREDIT,
                transactionType: null
            }),
            debtPrimaryCreditAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.PRIMARY,
                transactionEntryType: TransactionEntryTypeEnum.CREDIT,
                transactionType: TransactionTypeEnum.DEBT
            }),
            debtPrimaryDebitAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.PRIMARY,
                transactionEntryType: TransactionEntryTypeEnum.DEBIT,
                transactionType: TransactionTypeEnum.DEBT
            }),
            debitSettlementAmountSql: this.getEntryAmountSumSql({
                accountIdReference,
                baseInstrumentId,
                exchangeRateSql,
                transactionEntryKind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
                transactionEntryType: TransactionEntryTypeEnum.DEBIT,
                transactionType: null
            }),
            targetAmountSql
        };
    }

    private getEntryAmountSumSql(input: AccountBalanceDebtProgressEntryAmountSqlParamsInterface) {
        const { baseInstrumentId, exchangeRateSql } = input;
        const amountSql = sql<number>`(${this.getTransactionEntryAmountSumSql(input)})`;

        return isDefined(exchangeRateSql) && !isDefined(baseInstrumentId)
            ? sql<number>`COALESCE((${amountSql}) * ${exchangeRateSql}, 0)`
            : amountSql;
    }

    private getTransactionEntryAmountSumSql(input: AccountBalanceDebtProgressEntryAmountSqlParamsInterface) {
        const { transactionEntryType, transactionEntryKind, transactionType, accountIdReference } = input;
        const transactionTypeSql = isDefined(transactionType) ? sql`AND ${TransactionEntityTable.type} = ${transactionType}` : sql``;
        const entryAmountSql = this.getTransactionEntryAmountSql(input);

        return sql<number>`SELECT COALESCE(SUM(${entryAmountSql}), 0) FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql()} AND ${TransactionEntryEntityTable.type} = ${transactionEntryType} AND ${TransactionEntryEntityTable.kind} = ${transactionEntryKind} ${transactionTypeSql} AND ${accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()}`;
    }

    private getTransactionEntryAmountSql(input: AccountBalanceDebtProgressEntryAmountSqlParamsInterface) {
        const { baseInstrumentId, exchangeRateSql } = input;

        if (!isDefined(exchangeRateSql) || !isDefined(baseInstrumentId)) {
            return sql<number>`${TransactionEntryEntityTable.amount}`;
        }

        return sql<number>`
            CASE
                WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${baseInstrumentId}
                     AND ${TransactionEntryEntityTable.baseAmount} IS NOT NULL
                THEN ${TransactionEntryEntityTable.baseAmount}
                ELSE COALESCE(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}, 0)
            END
        `;
    }
}

export const accountBalanceDebtProgressSqlInputBuilder = new AccountBalanceDebtProgressSqlInputBuilder();
