/* eslint-disable max-lines -- File owns a single multi-stage balance SQL/CTE pipeline that must stay together */
import { Log } from '@budgie/logger';
import { type SQL, and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from '../../@generic/util/get-exchange-rate-sql.util';
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
    private static readonly CRYPTO_ACCOUNT_TYPES = [AccountTypeEnum.CRYPTO, AccountTypeEnum.CRYPTO_SYNC];

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

        const results = await database
            .select({
                accountId: TransactionEntryEntityTable.accountId,
                delta: this.getTransactionsSumSql().mapWith(Number)
            })
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    isNull(TransactionEntryEntityTable.deletedAt),
                    this.getBalanceLedgerEntryConditionSql(),
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
        const convertedBalanceSql = sql<number>`COALESCE((${balanceSql}) * ${this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId)}, 0)`;

        return this.db
            .select({
                account: AccountEntityTable,
                balance: balanceSql,
                bankSync: BankSyncEntityTable,
                convertedBalance: convertedBalanceSql,
                convertedTargetBalance: sql<number>`COALESCE(${AccountEntityTable.targetBalance} * ${this.buildFiatExchangeRateConversionSql(defaultInstrumentId)}, 0)`,
                instrument: InstrumentEntityTable
            })
            .from(AccountEntityTable)
            .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
            .leftJoin(
                BankSyncEntityTable,
                and(eq(BankSyncEntityTable.accountId, AccountEntityTable.id), isNull(BankSyncEntityTable.deletedAt))
            )
            .where(isNull(AccountEntityTable.deletedAt));
    }

    getLatestUpdatedAt() {
        return this.db
            .select({ updatedAt: sql<Date | null>`MAX(${AccountBalanceEntityTable.updatedAt})` })
            .from(AccountBalanceEntityTable)
            .where(isNull(AccountBalanceEntityTable.deletedAt));
    }

    getByAccountId(accountId: number) {
        return this.db
            .select({ balance: this.getAccountBalanceWithTransactionsSql(sql`${accountId}`) })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getArchivedAccountBalance(accountId: number) {
        const totalBalanceSql = sql<number>`
            COALESCE((
                SELECT ${this.getTransactionsSumSql()}
                FROM ${TransactionEntryEntityTable}
                WHERE ${TransactionEntryEntityTable.accountId} = ${accountId}
                  AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                  AND ${this.getBalanceLedgerEntryConditionSql()}
            ), 0)`;

        return this.db
            .select({
                balance: totalBalanceSql
            })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
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
        const remainingDebtSql = sql<number>`
            MAX(${AccountEntityTable.targetBalance} - (${this.getAccountBalanceWithTransactionsSql()}), 0)
        `;

        return this.db
            .select({ total: sql<number>`COALESCE(SUM((${remainingDebtSql}) * ${exchangeRateSql}), 0)` })
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
            .innerJoin(BankSyncEntityTable, eq(BankSyncEntityTable.accountId, AccountEntityTable.id))
            .where(this.getActiveAccountWhereSql(eq(BankSyncEntityTable.provider, provider), isNull(BankSyncEntityTable.deletedAt)));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable);
    }

    async truncateExceptBankAuthoritative(tx?: DB): Promise<void> {
        const database = tx ?? this.db;
        const bankAuthoritativeAccountIdsSql = database
            .select({ id: AccountEntityTable.id })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.type, AccountTypeEnum.CRYPTO_SYNC));

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
        return sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)},
            ${getInverseExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)},
            1.0
        )`;
    }

    private buildStrictExchangeRateConversionSql(defaultInstrumentId: number) {
        return sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)},
            ${getInverseExchangeRateSql(defaultInstrumentId, AccountBalanceRepository.ACCOUNT_INSTRUMENT_ID_SQL)}
        )`;
    }

    private getAccountBalanceWithTransactionsSql(accountIdReference = sql.raw('accounts.id')) {
        const latestAccountBalanceSql = sql<number>`
            SELECT ${AccountBalanceEntityTable.amount}
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}
            LIMIT 1`;

        const lastBalanceUpdatedAtSql = sql`
            SELECT MAX(${AccountBalanceEntityTable.updatedAt})
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}
        `;

        const transactionsSumSinceLastBalanceSql = sql<number>`
            SELECT ${this.getTransactionsSumSql()}
            FROM ${TransactionEntryEntityTable}
            WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference}
              AND ${TransactionEntryEntityTable.deletedAt} IS NULL
              AND ${this.getBalanceLedgerEntryConditionSql()}
              AND (
                  (${lastBalanceUpdatedAtSql}) IS NULL
                  OR ${TransactionEntryEntityTable.createdAt} > (${lastBalanceUpdatedAtSql})
              )
        `;

        const ledgerSumSql = sql<number>`CASE WHEN ${sql.raw('accounts.type')} = ${AccountTypeEnum.CRYPTO_SYNC} THEN 0 ELSE COALESCE((${transactionsSumSinceLastBalanceSql}), 0) END`;

        return sql<number>`COALESCE((${latestAccountBalanceSql}), 0) + ${ledgerSumSql}`;
    }

    private getTransactionsSumSql() {
        return sql<number>`
            SUM(CASE
                WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount}
                WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount}
                WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount}
                ELSE 0
            END)
        `;
    }

    private getBalanceLedgerEntryConditionSql() {
        return sql`
            (
                ${TransactionEntryEntityTable.originalTransactionId} IS NULL
                OR EXISTS (
                    SELECT 1
                    FROM ${TransactionEntityTable}
                    WHERE ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}
                      AND ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                      AND ${TransactionEntityTable.deletedAt} IS NULL
                )
            )
        `;
    }
}
