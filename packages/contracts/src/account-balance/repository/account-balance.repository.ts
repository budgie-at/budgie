import { Log } from '@budgie/logger';
import { type SQL, type SQLWrapper, and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { getExchangeRateWithHistoricalFallbackSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncEntityTable } from '../../bank-sync/table/bank-sync-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    private static readonly ACCOUNT_INSTRUMENT_ID_SQL = sql.raw('accounts.instrument_id');
    constructor(private db: DB) {}
    @Log(
        (accountIds, tx) => `enter balanceAccountIds=${accountIds.join(',')} usesTransaction=${String(isDefined(tx))}`,
        (result, accountIds, tx) =>
            `done balanceAccountIds=${accountIds.join(',')} usesTransaction=${String(isDefined(tx))} deltaAccountIds=${[...result.keys()].join(',')}`,
        (error, accountIds, tx) =>
            `throw balanceAccountIds=${accountIds.join(',')} usesTransaction=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async getNewTransactionEntriesDeltas(accountIds: number[], tx?: DB): Promise<Map<number, number>> {
        const database = tx ?? this.db;
        const results = await database.select({ accountId: TransactionEntryEntityTable.accountId, delta: this.getTransactionsSumSql().mapWith(Number) }).from(TransactionEntryEntityTable).innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)).where(and(isNull(TransactionEntryEntityTable.deletedAt), this.getLiveTransactionConditionSql(), this.getBalanceLedgerEntryConditionSql(), inArray(TransactionEntryEntityTable.accountId, accountIds), sql`(
                        NOT EXISTS (SELECT 1 FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId})
                        OR ${TransactionEntryEntityTable.createdAt} > (SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId})
                    )`)).groupBy(TransactionEntryEntityTable.accountId);

        return new Map(results.map(({ accountId, delta }) => [accountId, delta]));
    }

    getAssetClassTotals(defaultInstrumentId: number) {
        const fiatExchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);
        const cryptoExchangeRateSql = this.buildStrictExchangeRateConversionSql(defaultInstrumentId);
        const balanceSql = this.getAccountBalanceWithTransactionsSql();

        return this.db.select({ fiatTotal: sql<number>`COALESCE(SUM(CASE WHEN ${ne(AccountEntityTable.type, AccountTypeEnum.CRYPTO)} THEN (${balanceSql}) * ${fiatExchangeRateSql} ELSE 0 END), 0)`, cryptoTotal: sql<number>`COALESCE(SUM(CASE WHEN ${eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO)} THEN (${balanceSql}) * ${cryptoExchangeRateSql} ELSE 0 END), 0)`, fiatCount: sql<number>`COALESCE(SUM(CASE WHEN ${ne(AccountEntityTable.type, AccountTypeEnum.CRYPTO)} THEN 1 ELSE 0 END), 0)`, cryptoCount: sql<number>`COALESCE(SUM(CASE WHEN ${eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO)} THEN 1 ELSE 0 END), 0)` }).from(AccountEntityTable).where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    getTotalByCryptoInstrument(instrumentId: number) {
        return this.db.select({ balance: sql<number>`COALESCE(SUM(${this.getAccountBalanceWithTransactionsSql()}), 0)` }).from(AccountEntityTable).where(this.getActiveAccountWhereSql(eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO), eq(AccountEntityTable.instrumentId, instrumentId)));
    }

    async upsert(input: AccountBalanceCreateEntityInterface, tx?: DB): Promise<AccountBalanceEntityInterface> {
        const [accountBalance] = await (tx ?? this.db).insert(AccountBalanceEntityTable).values([input]).onConflictDoUpdate({ target: AccountBalanceEntityTable.accountId, set: { amount: input.amount, updatedAt: input.updatedAt ?? new Date() } }).returning();

        return accountBalance;
    }

    async getByAccountIds(accountIds: number[], tx?: DB): Promise<AccountBalanceEntityInterface[]> {
        return await (tx ?? this.db).select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    async deleteByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    getHomeAccountRows(defaultInstrumentId: number) {
        const balanceSql = this.getAccountBalanceWithTransactionsSql();
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
        const convertedBalanceSql = sql<number>`COALESCE((${balanceSql}) * ${exchangeRateSql}, 0)`;
        const convertedDebitAmountSql = sql<number>`COALESCE((${this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT)}) * ${exchangeRateSql}, 0)`;
        const convertedCreditAmountSql = sql<number>`COALESCE((${this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT)}) * ${exchangeRateSql}, 0)`;
        const convertedTargetBalanceSql = sql<number>`COALESCE(${AccountEntityTable.targetBalance} * ${exchangeRateSql}, 0)`;
        const debtProgressSql = this.getDebtProgressSql(convertedBalanceSql, convertedDebitAmountSql, convertedCreditAmountSql, convertedTargetBalanceSql);

        return this.db.select({ account: AccountEntityTable, balance: balanceSql, bankSync: BankSyncEntityTable, convertedBalance: convertedBalanceSql, convertedCreditAmount: convertedCreditAmountSql, convertedDebtClosedAmount: debtProgressSql.closedAmount, convertedDebtOpenedAmount: debtProgressSql.openedAmount, convertedDebtOutstandingAmount: debtProgressSql.outstandingAmount, convertedDebtPaidAmount: debtProgressSql.paidAmount, convertedDebtTotalAmount: debtProgressSql.totalAmount, convertedDebitAmount: convertedDebitAmountSql, convertedTargetBalance: convertedTargetBalanceSql, debtProgressPercentage: debtProgressSql.percentage, instrument: InstrumentEntityTable }).from(AccountEntityTable).innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId)).leftJoin(BankSyncEntityTable, and(eq(BankSyncEntityTable.accountId, AccountEntityTable.id), isNull(BankSyncEntityTable.deletedAt))).where(isNull(AccountEntityTable.deletedAt));
    }

    getLatestUpdatedAt() {
        return this.db.select({ updatedAt: sql<Date | null>`MAX(${AccountBalanceEntityTable.updatedAt})` }).from(AccountBalanceEntityTable).where(isNull(AccountBalanceEntityTable.deletedAt));
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
        const balanceSql = this.getAccountBalanceWithTransactionsSql(accountIdReference);
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT, accountIdReference);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT, accountIdReference);
        const debtProgressSql = this.getDebtProgressSql(balanceSql, debitAmountSql, creditAmountSql, AccountEntityTable.targetBalance);

        return this.db.select({ closedAmount: debtProgressSql.closedAmount, creditAmount: creditAmountSql.mapWith(Number), debitAmount: debitAmountSql.mapWith(Number), openedAmount: debtProgressSql.openedAmount, outstandingAmount: debtProgressSql.outstandingAmount, paidAmount: debtProgressSql.paidAmount, percentage: debtProgressSql.percentage, totalAmount: debtProgressSql.totalAmount }).from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).limit(1);
    }

    getArchivedAccountBalance(accountId: number) {
        const totalBalanceSql = sql<number>`
            COALESCE((
                SELECT ${this.getTransactionsSumSql()}
                FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}
                WHERE ${TransactionEntryEntityTable.accountId} = ${accountId}
                  AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                  AND ${this.getLiveTransactionConditionSql()}
                  AND ${this.getBalanceLedgerEntryConditionSql()}
            ), 0)`;

        return this.db.select({ balance: totalBalanceSql }).from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).limit(1);
    }

    getNetWorth(defaultInstrumentId: number) {
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);

        return this.db.select({ netWorth: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` }).from(AccountEntityTable).where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    getTotalByAccountType(defaultInstrumentId: number, accountType: AccountTypeEnum) {
        const exchangeRateSql =
            accountType === AccountTypeEnum.CRYPTO
                ? this.buildStrictExchangeRateConversionSql(defaultInstrumentId)
                : this.buildFiatExchangeRateConversionSql(defaultInstrumentId);

        return this.db.select({ total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` }).from(AccountEntityTable).where(this.getActiveAccountWhereSql(eq(AccountEntityTable.type, accountType)));
    }

    getTotalRemainingDebtByType(defaultInstrumentId: number, debtType: AccountDebtTypeEnum) {
        const exchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);
        const balanceSql = this.getAccountBalanceWithTransactionsSql();
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT);
        const debtProgressSql = this.getDebtProgressSql(balanceSql, debitAmountSql, creditAmountSql, AccountEntityTable.targetBalance);

        return this.db.select({ total: sql<number>`COALESCE(SUM((${debtProgressSql.outstandingAmount}) * ${exchangeRateSql}), 0)` }).from(AccountEntityTable).where(this.getActiveAccountWhereSql(eq(AccountEntityTable.type, AccountTypeEnum.DEBT), eq(AccountEntityTable.debtType, debtType)));
    }

    getTotalByBankProvider(defaultInstrumentId: number, provider: ExternalSourceEnum) {
        const exchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);

        return this.db.select({ total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` }).from(AccountEntityTable).innerJoin(BankSyncEntityTable, eq(BankSyncEntityTable.accountId, AccountEntityTable.id)).where(this.getActiveAccountWhereSql(eq(BankSyncEntityTable.provider, provider), isNull(BankSyncEntityTable.deletedAt)));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable);
    }

    private buildNetWorthExchangeRateConversionSql(defaultInstrumentId: number) {
        return sql`CASE WHEN ${eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO)} THEN ${this.buildStrictExchangeRateConversionSql(defaultInstrumentId)} ELSE ${this.buildFiatExchangeRateConversionSql(defaultInstrumentId)} END`;
    }

    private getActiveAccountWhereSql(...conditions: SQL[]) {
        return and(...conditions, eq(AccountEntityTable.isActive, true), isNull(AccountEntityTable.deletedAt));
    }

    private buildFiatExchangeRateConversionSql(defaultInstrumentId: number) {
        return sql`COALESCE(${getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)}, 1.0)`;
    }

    private buildStrictExchangeRateConversionSql(defaultInstrumentId: number) {
        return getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL);
    }

    private getAccountBalanceWithTransactionsSql(accountIdReference = sql.raw('accounts.id')) {
        const latestAccountBalanceSql = sql<number>`SELECT ${AccountBalanceEntityTable.amount} FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference} LIMIT 1`;
        const lastBalanceUpdatedAtSql = sql`SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}`;
        const transactionsSumSinceLastBalanceSql = sql<number>`SELECT ${this.getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${this.getLiveTransactionConditionSql()} AND ${this.getBalanceLedgerEntryConditionSql()} AND ((${lastBalanceUpdatedAtSql}) IS NULL OR ${TransactionEntryEntityTable.createdAt} > (${lastBalanceUpdatedAtSql}))`;

        return sql<number>`COALESCE((${latestAccountBalanceSql}), 0) + COALESCE((${transactionsSumSinceLastBalanceSql}), 0)`;
    }

    private getTransactionsSumSql() {
        return sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE 0 END)`;
    }

    private getTransactionEntryAmountSumSql(transactionEntryType: TransactionEntryTypeEnum, accountIdReference = sql.raw('accounts.id')) {
        return sql<number>`SELECT COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0) FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${this.getLiveTransactionConditionSql()} AND ${TransactionEntryEntityTable.type} = ${transactionEntryType} AND ${this.getBalanceLedgerEntryConditionSql()}`;
    }

    private getDebtProgressSql(balanceSql: SQL, debitAmountSql: SQL, creditAmountSql: SQL, targetAmountSql: SQL | SQLWrapper) {
        const balanceValueSql = sql<number>`(${balanceSql})`;
        const debitAmountValueSql = sql<number>`(${debitAmountSql})`;
        const creditAmountValueSql = sql<number>`(${creditAmountSql})`;
        const targetAmountValueSql = sql<number>`(${targetAmountSql})`;
        const closedAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${debitAmountValueSql} ELSE ${creditAmountValueSql} END`;
        const openedAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN ${creditAmountValueSql} ELSE ${debitAmountValueSql} END`;
        const signedOutstandingAmountSql = sql<number>`CASE WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW} THEN 0 - ${balanceValueSql} ELSE ${balanceValueSql} END`;

        return this.getDebtProgressComputedSql(closedAmountSql, openedAmountSql, signedOutstandingAmountSql, targetAmountValueSql);
    }

    private getDebtProgressComputedSql(closedAmountSql: SQL<number>, openedAmountSql: SQL<number>, signedOutstandingAmountSql: SQL<number>, targetAmountSql: SQL<number>) {
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

        return { closedAmount: closedAmountSql.mapWith(Number), openedAmount: openedAmountSql.mapWith(Number), outstandingAmount: outstandingAmountSql.mapWith(Number), paidAmount: paidAmountSql.mapWith(Number), percentage: percentageSql.mapWith(Number), totalAmount: totalAmountSql.mapWith(Number) };
    }

    private getLiveTransactionConditionSql() {
        return sql`${TransactionEntityTable.deletedAt} IS NULL AND ${TransactionEntityTable.consolidationParentTransactionId} IS NULL`;
    }

    private getBalanceLedgerEntryConditionSql() {
        return sql`
            (
                ${TransactionEntryEntityTable.originalTransactionId} IS NULL
                OR ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
            )
        `;
    }
}
