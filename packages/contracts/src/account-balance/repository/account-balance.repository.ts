import { Log } from '@budgie/logger';
import { type SQL, type SQLWrapper, and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';

import { getErrorMessage } from '@rnw-community/shared';

import { getExchangeRateWithHistoricalFallbackSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../../account/constant/bank-authoritative-account-types.constant';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SyncEntityTable } from '../../sync/table/sync-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import { accountBalanceDebtProgressSqlInputBuilder } from './account-balance-debt-progress-sql-input.builder';
import { accountBalanceDebtProgressSqlBuilder } from './account-balance-debt-progress-sql.builder';
import { accountBalanceLedgerSqlBuilder } from './account-balance-ledger-sql.builder';

import type { DB } from '../../@generic/type/db.type';
import type { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    private static readonly CRYPTO_ACCOUNT_TYPES = [AccountTypeEnum.CRYPTO, AccountTypeEnum.CRYPTO_SYNC];
    constructor(private db: DB) {}
    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async getNewTransactionEntriesDeltas(accountIds: number[], tx?: DB): Promise<Map<number, number>> {
        const database = tx ?? this.db;
        const results = await database
            .select({ accountId: TransactionEntryEntityTable.accountId, delta: this.getTransactionsSumSql().mapWith(Number) })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    isNull(TransactionEntryEntityTable.deletedAt),
                    accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql(),
                    accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql(),
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    sql`(
                        NOT EXISTS (SELECT 1 FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId})
                        OR ${TransactionEntryEntityTable.createdAt} > (SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId})
                    )`
                )
            )
            .groupBy(TransactionEntryEntityTable.accountId);

        return new Map(results.map(({ accountId, delta }) => [accountId, delta]));
    }

    getAssetClassTotals(defaultInstrumentId: number) {
        const fiatExchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);
        const cryptoExchangeRateSql = this.buildStrictExchangeRateConversionSql(defaultInstrumentId);
        const balanceSql = this.getAccountBalanceWithTransactionsSql();

        return this.db
            .select({
                fiatTotal: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES)} THEN (${balanceSql}) * ${fiatExchangeRateSql} ELSE 0 END), 0)`,
                cryptoTotal: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES)} THEN (${balanceSql}) * ${cryptoExchangeRateSql} ELSE 0 END), 0)`,
                fiatCount: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`,
                cryptoCount: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`
            })
            .from(AccountEntityTable)
            .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    getTotalByCryptoInstrument(instrumentId: number) {
        return this.db
            .select({ balance: sql<number>`COALESCE(SUM(${this.getAccountBalanceWithTransactionsSql()}), 0)` })
            .from(AccountEntityTable)
            .where(
                this.getActiveAccountWhereSql(
                    inArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES),
                    eq(AccountEntityTable.instrumentId, instrumentId)
                )
            );
    }

    async upsert(input: AccountBalanceCreateEntityInterface, tx?: DB): Promise<AccountBalanceEntityInterface> {
        const [accountBalance] = await (tx ?? this.db)
            .insert(AccountBalanceEntityTable)
            .values([input])
            .onConflictDoUpdate({
                target: AccountBalanceEntityTable.accountId,
                set: { amount: input.amount, updatedAt: input.updatedAt ?? new Date() }
            })
            .returning();

        return accountBalance;
    }

    async getByAccountIds(accountIds: number[], tx?: DB): Promise<AccountBalanceEntityInterface[]> {
        return await (tx ?? this.db)
            .select()
            .from(AccountBalanceEntityTable)
            .where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    async deleteByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    getHomeAccountRows(defaultInstrumentId: number) {
        const balanceSql = this.getAccountBalanceWithTransactionsSql();
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT);
        const convertedBalanceSql = sql<number>`COALESCE((${balanceSql}) * ${exchangeRateSql}, 0)`;
        const convertedDebitAmountSql = sql<number>`COALESCE((${debitAmountSql}) * ${exchangeRateSql}, 0)`;
        const convertedCreditAmountSql = sql<number>`COALESCE((${creditAmountSql}) * ${exchangeRateSql}, 0)`;
        const convertedTargetBalanceSql = this.getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
        const debtProgressSql = accountBalanceDebtProgressSqlBuilder.getDebtProgressSql(
            this.getDebtProgressSqlInput(null, null, AccountEntityTable.targetBalance)
        );
        const convertedDebtProgressSql = accountBalanceDebtProgressSqlBuilder.getDebtProgressSql(
            this.getDebtProgressSqlInput(defaultInstrumentId, exchangeRateSql, convertedTargetBalanceSql)
        );

        return this.db
            .select({
                account: AccountEntityTable,
                balance: balanceSql,
                sync: SyncEntityTable,
                creditAmount: sql<number>`(${creditAmountSql})`.mapWith(Number),
                convertedBalance: convertedBalanceSql,
                convertedCreditAmount: convertedCreditAmountSql,
                convertedDebtClosedAmount: convertedDebtProgressSql.closedAmount,
                convertedDebtOpenedAmount: convertedDebtProgressSql.openedAmount,
                convertedDebtOutstandingAmount: convertedDebtProgressSql.outstandingAmount,
                convertedDebtPaidAmount: convertedDebtProgressSql.paidAmount,
                convertedDebtTotalAmount: convertedDebtProgressSql.totalAmount,
                convertedDebitAmount: convertedDebitAmountSql,
                convertedTargetBalance: convertedTargetBalanceSql,
                debitAmount: sql<number>`(${debitAmountSql})`.mapWith(Number),
                debtClosedAmount: debtProgressSql.closedAmount,
                debtOpenedAmount: debtProgressSql.openedAmount,
                debtOutstandingAmount: debtProgressSql.outstandingAmount,
                debtPaidAmount: debtProgressSql.paidAmount,
                debtProgressPercentage: debtProgressSql.percentage,
                debtTotalAmount: debtProgressSql.totalAmount,
                instrument: InstrumentEntityTable
            })
            .from(AccountEntityTable)
            .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
            .leftJoin(SyncEntityTable, and(eq(SyncEntityTable.accountId, AccountEntityTable.id), isNull(SyncEntityTable.deletedAt)))
            .where(isNull(AccountEntityTable.deletedAt));
    }

    getLatestUpdatedAt() {
        return this.db
            .select({ updatedAt: sql<Date | null>`MAX(${AccountBalanceEntityTable.updatedAt})` })
            .from(AccountBalanceEntityTable)
            .where(isNull(AccountBalanceEntityTable.deletedAt));
    }

    getByAccountId(accountId: number, tx?: DB) {
        return (tx ?? this.db)
            .select({ balance: this.getAccountBalanceWithTransactionsSql(sql`${accountId}`) })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getDebtAccountProgressByAccountId(accountId: number) {
        const accountIdReference = sql`${accountId}`;
        const debtProgressSqlInput = this.getDebtProgressSqlInput(null, null, AccountEntityTable.targetBalance, accountIdReference);

        return this.db
            .select(accountBalanceDebtProgressSqlBuilder.getDebtProgressSelectSql(debtProgressSqlInput))
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getArchivedAccountBalance(accountId: number) {
        const totalBalanceSql = sql<number>`
            COALESCE((
                SELECT ${this.getTransactionsSumSql()}
                FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}
                WHERE ${TransactionEntryEntityTable.accountId} = ${accountId}
                  AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                  AND ${accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql()}
                  AND ${accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()}
            ), 0)`;

        return this.db.select({ balance: totalBalanceSql }).from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).limit(1);
    }

    getNetWorth(defaultInstrumentId: number) {
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);

        return this.db
            .select({ netWorth: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
            .from(AccountEntityTable)
            .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    getTotalByAccountType(defaultInstrumentId: number, accountType: AccountTypeEnum) {
        const isCryptoAccountType = AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES.includes(accountType);
        const exchangeRateSql = isCryptoAccountType
            ? this.buildStrictExchangeRateConversionSql(defaultInstrumentId)
            : this.buildFiatExchangeRateConversionSql(defaultInstrumentId);

        return this.db
            .select({ total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
            .from(AccountEntityTable)
            .where(this.getActiveAccountWhereSql(eq(AccountEntityTable.type, accountType)));
    }

    getTotalRemainingDebtByType(defaultInstrumentId: number, debtType: AccountDebtTypeEnum) {
        const exchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);
        const convertedTargetBalanceSql = this.getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
        const debtProgressSql = accountBalanceDebtProgressSqlBuilder.getDebtProgressSql(
            this.getDebtProgressSqlInput(defaultInstrumentId, exchangeRateSql, convertedTargetBalanceSql)
        );

        return this.db
            .select({ total: sql<number>`COALESCE(SUM(${debtProgressSql.outstandingAmount}), 0)` })
            .from(AccountEntityTable)
            .where(
                this.getActiveAccountWhereSql(eq(AccountEntityTable.type, AccountTypeEnum.DEBT), eq(AccountEntityTable.debtType, debtType))
            );
    }

    getTotalByBankProvider(defaultInstrumentId: number, provider: ExternalSourceEnum) {
        const exchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);

        return this.db
            .select({ total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
            .from(AccountEntityTable)
            .innerJoin(SyncEntityTable, eq(SyncEntityTable.accountId, AccountEntityTable.id))
            .where(this.getActiveAccountWhereSql(eq(SyncEntityTable.provider, provider), isNull(SyncEntityTable.deletedAt)));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable);
    }

    async truncateExceptBankAuthoritative(tx?: DB): Promise<void> {
        const database = tx ?? this.db;
        const bankAuthoritativeAccountIdsSql = database
            .select({ id: AccountEntityTable.id })
            .from(AccountEntityTable)
            .where(inArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES));

        await database
            .delete(AccountBalanceEntityTable)
            .where(notInArray(AccountBalanceEntityTable.accountId, bankAuthoritativeAccountIdsSql));
    }

    private buildNetWorthExchangeRateConversionSql(defaultInstrumentId: number) {
        return sql`CASE WHEN ${inArray(AccountEntityTable.type, AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES)} THEN ${this.buildStrictExchangeRateConversionSql(defaultInstrumentId)} ELSE ${this.buildFiatExchangeRateConversionSql(defaultInstrumentId)} END`;
    }

    private getActiveAccountWhereSql(...conditions: SQL[]) {
        return and(...conditions, eq(AccountEntityTable.isActive, true), isNull(AccountEntityTable.deletedAt));
    }

    private buildFiatExchangeRateConversionSql(defaultInstrumentId: number) {
        return sql`COALESCE(${getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))}, 1.0)`;
    }

    private buildStrictExchangeRateConversionSql(defaultInstrumentId: number) {
        return getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, sql.raw('accounts.instrument_id'));
    }

    private getConvertedDebtTargetBalanceSql(defaultInstrumentId: number, exchangeRateSql: SQL) {
        return sql<number>`CASE WHEN ${AccountEntityTable.targetBaseInstrumentId} = ${defaultInstrumentId} AND ${AccountEntityTable.targetBaseAmount} IS NOT NULL THEN ${AccountEntityTable.targetBaseAmount} ELSE COALESCE(${AccountEntityTable.targetBalance} * ${exchangeRateSql}, 0) END`;
    }

    private getDebtProgressSqlInput(
        baseInstrumentId: number | null,
        exchangeRateSql: SQL | null,
        targetAmountSql: SQL | SQLWrapper,
        accountIdReference = sql.raw('accounts.id')
    ) {
        return accountBalanceDebtProgressSqlInputBuilder.build({ accountIdReference, baseInstrumentId, exchangeRateSql, targetAmountSql });
    }

    private getAccountBalanceWithTransactionsSql(accountIdReference = sql.raw('accounts.id')) {
        const latestAccountBalanceSql = sql<number>`SELECT ${AccountBalanceEntityTable.amount} FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference} LIMIT 1`;
        const lastBalanceUpdatedAtSql = sql`SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}`;
        const transactionsSumSinceLastBalanceSql = sql<number>`SELECT ${this.getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql()} AND ${accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()} AND ((${lastBalanceUpdatedAtSql}) IS NULL OR ${TransactionEntryEntityTable.createdAt} > (${lastBalanceUpdatedAtSql}))`;

        const ledgerSumSql = sql<number>`CASE WHEN ${inArray(sql.raw('accounts.type'), BANK_AUTHORITATIVE_ACCOUNT_TYPES)} THEN 0 ELSE COALESCE((${transactionsSumSinceLastBalanceSql}), 0) END`;

        return sql<number>`COALESCE((${latestAccountBalanceSql}), 0) + ${ledgerSumSql}`;
    }

    private getTransactionsSumSql() {
        return sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE 0 END)`;
    }

    private getTransactionEntryAmountSumSql(transactionEntryType: TransactionEntryTypeEnum) {
        return sql<number>`SELECT COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0) FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${sql.raw('accounts.id')} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql()} AND ${TransactionEntryEntityTable.type} = ${transactionEntryType} AND ${accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()}`;
    }
}
