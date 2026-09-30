/* eslint-disable max-lines -- File owns the account-balance ledger and valuation SQL pipeline that must stay together */
import { type SQL, type SQLWrapper, and, eq, inArray, isNull, lte, notInArray, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { Db } from '../../@generic/service/db.service';
import { getExchangeRateWithHistoricalFallbackSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../../account/constant/bank-authoritative-account-types.constant';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DebtEventDirectionEnum } from '../../debt-event/enum/debt-event-direction.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SyncModeEnum } from '../../sync/enum/sync-mode.enum';
import { SyncEntityTable } from '../../sync/table/sync-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import { accountBalanceDebtProgressSqlInputBuilder } from './account-balance-debt-progress-sql-input.builder';
import { accountBalanceDebtProgressSqlBuilder } from './account-balance-debt-progress-sql.builder';
import { accountBalanceLedgerSqlBuilder } from './account-balance-ledger-sql.builder';

import type { DB } from '../../@generic/type/db.type';
import type { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';

export class AccountBalanceRepository {
    private static readonly CRYPTO_ACCOUNT_TYPES = [AccountTypeEnum.CRYPTO, AccountTypeEnum.CRYPTO_SYNC];

    private static readonly LIQUID_ACCOUNT_TYPES = [AccountTypeEnum.CASH, AccountTypeEnum.BANK, AccountTypeEnum.BANK_SYNC];

    readonly getLedgerBalances = Effect.fn('AccountBalanceRepository.getLedgerBalances')(function* (
        this: AccountBalanceRepository,
        accountIds: number[]
    ) {
        const results = yield* Db.query(db =>
            db
                .select({ accountId: TransactionEntryEntityTable.accountId, balance: this.getTransactionsSumSql().mapWith(Number) })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(
                    and(
                        isNull(TransactionEntryEntityTable.deletedAt),
                        accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql(),
                        accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql(),
                        inArray(TransactionEntryEntityTable.accountId, accountIds)
                    )
                )
                .groupBy(TransactionEntryEntityTable.accountId)
        );

        return new Map(results.map(({ accountId, balance }) => [accountId, balance]));
    });

    constructor(private db: DB) {}

    readonly getDebtLedgerAmounts = (accountIds: number[]) =>
        Db.query(db =>
            db
                .select({
                    accountId: DebtEventEntityTable.debtAccountId,
                    openedAmount: this.getDebtEventDirectionSumSql(DebtEventDirectionEnum.OPEN),
                    closedAmount: this.getDebtEventDirectionSumSql(DebtEventDirectionEnum.CLOSE)
                })
                .from(DebtEventEntityTable)
                .where(and(inArray(DebtEventEntityTable.debtAccountId, accountIds), isNull(DebtEventEntityTable.deletedAt)))
                .groupBy(DebtEventEntityTable.debtAccountId)
        );

    readonly getLedgerBalanceUntil = (accountId: number, operatedUntil: Date) =>
        Db.query(db =>
            db
                .select({ balance: sql<number>`COALESCE(${this.getTransactionsSumSql()}, 0)`.mapWith(Number) })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                .where(
                    and(
                        eq(TransactionEntryEntityTable.accountId, accountId),
                        isNull(TransactionEntryEntityTable.deletedAt),
                        lte(TransactionEntityTable.operatedAt, operatedUntil),
                        accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql(),
                        accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()
                    )
                )
        ).pipe(Effect.map(([row]) => row.balance));

    readonly upsert = (input: Pick<AccountBalanceCreateEntityInterface, 'accountId' | 'amount'>) =>
        Db.query(db =>
            db
                .insert(AccountBalanceEntityTable)
                .values([{ accountId: input.accountId, amount: input.amount }])
                .onConflictDoUpdate({
                    target: AccountBalanceEntityTable.accountId,
                    set: { amount: input.amount, updatedAt: CURRENT_TIMESTAMP }
                })
                .returning()
        ).pipe(Effect.map(([accountBalance]) => accountBalance));

    readonly getByAccountIds = (accountIds: number[]) =>
        Db.query(db => db.select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds)));

    readonly deleteByAccountIds = (accountIds: number[]) =>
        Db.query(db => db.delete(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds)));

    readonly truncate = () => Db.query(db => db.delete(AccountBalanceEntityTable));

    readonly truncateExceptBankAuthoritative = () =>
        Db.query(db =>
            db
                .delete(AccountBalanceEntityTable)
                .where(
                    notInArray(
                        AccountBalanceEntityTable.accountId,
                        db
                            .select({ id: AccountEntityTable.id })
                            .from(AccountEntityTable)
                            .where(inArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES))
                    )
                )
        );

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

    getHomeAccountRows(defaultInstrumentId: number) {
        const balanceSql = this.getAccountBalanceWithTransactionsSql();
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
        const convertedBalanceSql = sql<number>`COALESCE((${balanceSql}) * ${exchangeRateSql}, 0)`;
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
                convertedBalance: convertedBalanceSql,
                convertedDebtOutstandingAmount: convertedDebtProgressSql.outstandingAmount,
                convertedDebtOverpaidAmount: convertedDebtProgressSql.overpaidAmount,
                convertedDebtPaidAmount: convertedDebtProgressSql.paidAmount,
                convertedDebtTotalAmount: convertedDebtProgressSql.totalAmount,
                convertedTargetBalance: convertedTargetBalanceSql,
                debtOutstandingAmount: debtProgressSql.outstandingAmount,
                debtOverpaidAmount: debtProgressSql.overpaidAmount,
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

    getByAccountId(accountId: number, db: DB = this.db) {
        return db
            .select({ balance: this.getAccountBalanceWithTransactionsSql(sql`${accountId}`) })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getDebtAccountProgressByAccountId(accountId: number) {
        return this.db
            .select(
                accountBalanceDebtProgressSqlBuilder.getDebtProgressSql(
                    this.getDebtProgressSqlInput(null, null, AccountEntityTable.targetBalance, sql`${accountId}`)
                )
            )
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getArchivedAccountBalance(accountId: number) {
        const totalBalanceSql = sql<number>`
            COALESCE((
                SELECT ${this.getTransactionsSumSql()}
                FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${sql`${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}`}
                WHERE ${sql`${TransactionEntryEntityTable.accountId} = ${accountId}`}
                  AND ${sql`${TransactionEntryEntityTable.deletedAt} IS NULL`}
                  AND ${sql`${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}`}
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

    getLiquidTotal(defaultInstrumentId: number, isCryptoIncluded: boolean) {
        const exchangeRateSql = this.buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
        const accountTypes = isCryptoIncluded
            ? [...AccountBalanceRepository.LIQUID_ACCOUNT_TYPES, ...AccountBalanceRepository.CRYPTO_ACCOUNT_TYPES]
            : AccountBalanceRepository.LIQUID_ACCOUNT_TYPES;

        return this.db
            .select({ total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
            .from(AccountEntityTable)
            .where(this.getActiveAccountWhereSql(inArray(AccountEntityTable.type, accountTypes)));
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

    private getDebtEventDirectionSumSql(direction: DebtEventDirectionEnum) {
        return sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${direction} THEN ${DebtEventEntityTable.amount} ELSE 0 END), 0)`.mapWith(
            Number
        );
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
        const transactionsSumSinceLastBalanceSql = sql<number>`SELECT ${this.getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${accountBalanceLedgerSqlBuilder.getLiveTransactionConditionSql()} AND ${accountBalanceLedgerSqlBuilder.getBalanceLedgerEntryConditionSql()} AND ${TransactionEntryEntityTable.createdAt} > COALESCE((${lastBalanceUpdatedAtSql}), -1)`;

        const ledgerSumSql = sql<number>`CASE WHEN ${inArray(sql.raw('accounts.type'), BANK_AUTHORITATIVE_ACCOUNT_TYPES)} THEN 0 ELSE COALESCE((${transactionsSumSinceLastBalanceSql}), 0) END`;

        const setupBalanceSql = sql<number>`SELECT ${SyncEntityTable.setupBalance} FROM ${SyncEntityTable} WHERE ${SyncEntityTable.accountId} = ${accountIdReference} AND ${SyncEntityTable.mode} = ${SyncModeEnum.BACKWARD} AND ${SyncEntityTable.deletedAt} IS NULL`;

        return sql<number>`COALESCE((${setupBalanceSql}), COALESCE((${latestAccountBalanceSql}), 0) + ${ledgerSumSql})`;
    }

    private getTransactionsSumSql() {
        return sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE 0 END)`;
    }
}
