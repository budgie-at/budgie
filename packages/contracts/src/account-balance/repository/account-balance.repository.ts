/* eslint-disable max-lines -- File owns the account-balance ledger and valuation SQL pipeline that must stay together */
import { type SQL, type SQLWrapper, and, eq, inArray, isNull, lte, notInArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { getExchangeRateWithHistoricalFallbackSql } from '../../@generic/utils/get-exchange-rate-sql.util';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../../account/constant/bank-authoritative-account-types.constant';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankIntegrationEntityTable } from '../../bank-integration/table/bank-integration-entity.table';
import { DebtEventDirectionEnum } from '../../debt-event/enum/debt-event-direction.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SyncModeEnum } from '../../sync/enum/sync-mode.enum';
import { SyncEntityTable } from '../../sync/table/sync-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';

const CRYPTO_ACCOUNT_TYPES = [AccountTypeEnum.CRYPTO, AccountTypeEnum.CRYPTO_SYNC];

const LIQUID_ACCOUNT_TYPES = [AccountTypeEnum.CASH, AccountTypeEnum.BANK, AccountTypeEnum.BANK_SYNC];

const getTransactionsSumSql = () =>
    sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE 0 END)`;

const buildFiatExchangeRateConversionSql = (defaultInstrumentId: number) =>
    sql`COALESCE(${getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))}, 1.0)`;

const buildStrictExchangeRateConversionSql = (defaultInstrumentId: number) =>
    getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, sql.raw('accounts.instrument_id'));

const buildNetWorthExchangeRateConversionSql = (defaultInstrumentId: number) =>
    sql`CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN ${buildStrictExchangeRateConversionSql(defaultInstrumentId)} ELSE ${buildFiatExchangeRateConversionSql(defaultInstrumentId)} END`;

const getActiveAccountWhereSql = (...conditions: SQL[]) =>
    and(...conditions, eq(AccountEntityTable.isActive, true), isNull(AccountEntityTable.deletedAt));

const getConvertedDebtTargetBalanceSql = (defaultInstrumentId: number, exchangeRateSql: SQL) =>
    sql<number>`CASE WHEN ${AccountEntityTable.targetBaseInstrumentId} = ${defaultInstrumentId} AND ${AccountEntityTable.targetBaseAmount} IS NOT NULL THEN ${AccountEntityTable.targetBaseAmount} ELSE COALESCE(${AccountEntityTable.targetBalance} * ${exchangeRateSql}, 0) END`;

const getBalanceLedgerEntryConditionSql = () =>
    sql`(${TransactionEntryEntityTable.originalTransactionId} IS NULL OR ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND})`;

const getDebtProgressSql = (
    baseInstrumentId: number | null,
    exchangeRateSql: SQL | null,
    targetAmountSql: SQL | SQLWrapper,
    accountIdReference = sql.raw('accounts.id')
) => {
    const debtEventAmountSql =
        isDefined(exchangeRateSql) && isDefined(baseInstrumentId)
            ? sql<number>`CASE WHEN ${DebtEventEntityTable.baseInstrumentId} = ${baseInstrumentId} AND ${DebtEventEntityTable.baseAmount} IS NOT NULL THEN ${DebtEventEntityTable.baseAmount} ELSE COALESCE(${DebtEventEntityTable.amount} * ${exchangeRateSql}, 0) END`
            : sql<number>`${DebtEventEntityTable.amount}`;
    const getDebtEventAmountSumSql = (direction: DebtEventDirectionEnum) =>
        sql<number>`SELECT COALESCE(SUM(${debtEventAmountSql}), 0) FROM ${DebtEventEntityTable} WHERE ${DebtEventEntityTable.debtAccountId} = ${accountIdReference} AND ${DebtEventEntityTable.deletedAt} IS NULL AND ${DebtEventEntityTable.direction} = ${direction}`;
    const eventOpenedAmountSql = getDebtEventAmountSumSql(DebtEventDirectionEnum.OPEN);
    const openedAmountSql = sql<number>`MAX((CASE WHEN (${eventOpenedAmountSql}) > 0 THEN (${eventOpenedAmountSql}) ELSE (${targetAmountSql}) END), 0)`;
    const closedAmountSql = sql<number>`MAX((${getDebtEventAmountSumSql(DebtEventDirectionEnum.CLOSE)}), 0)`;

    return {
        outstandingAmount: sql<number>`MAX(${openedAmountSql} - ${closedAmountSql}, 0)`.mapWith(Number),
        overpaidAmount: sql<number>`MAX(${closedAmountSql} - ${openedAmountSql}, 0)`.mapWith(Number),
        paidAmount: closedAmountSql.mapWith(Number),
        percentage:
            sql<number>`CASE WHEN ${openedAmountSql} > 0 THEN MIN(ROUND((${closedAmountSql} * 100.0) / ${openedAmountSql}, 2), 100) ELSE 0 END`.mapWith(
                Number
            ),
        totalAmount: openedAmountSql.mapWith(Number)
    };
};

const getAccountBalanceWithTransactionsSql = (accountIdReference = sql.raw('accounts.id')) => {
    const latestAccountBalanceSql = sql<number>`SELECT ${AccountBalanceEntityTable.amount} FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference} LIMIT 1`;
    const lastBalanceUpdatedAtSql = sql`SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}`;
    const transactionsSumSinceLastBalanceSql = sql<number>`SELECT ${getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${transactionFilters.buildVisibleTransactionCondition()} AND ${getBalanceLedgerEntryConditionSql()} AND ${TransactionEntryEntityTable.createdAt} > COALESCE((${lastBalanceUpdatedAtSql}), -1)`;

    const ledgerSumSql = sql<number>`CASE WHEN ${inArray(sql.raw('accounts.type'), BANK_AUTHORITATIVE_ACCOUNT_TYPES)} THEN 0 ELSE COALESCE((${transactionsSumSinceLastBalanceSql}), 0) END`;

    const setupBalanceSql = sql<number>`SELECT ${SyncEntityTable.setupBalance} FROM ${SyncEntityTable} WHERE ${SyncEntityTable.accountId} = ${accountIdReference} AND ${SyncEntityTable.mode} = ${SyncModeEnum.BACKWARD} AND ${SyncEntityTable.deletedAt} IS NULL`;

    return sql<number>`COALESCE((${setupBalanceSql}), COALESCE((${latestAccountBalanceSql}), 0) + ${ledgerSumSql})`;
};

const bulkUpsert = (balances: Pick<AccountBalanceCreateEntityInterface, 'accountId' | 'amount'>[]) =>
    Db.query(db =>
        db
            .insert(AccountBalanceEntityTable)
            .values(balances.map(({ accountId, amount }) => ({ accountId, amount })))
            .onConflictDoUpdate({
                target: AccountBalanceEntityTable.accountId,
                set: { amount: sql`excluded.${sql.identifier(AccountBalanceEntityTable.amount.name)}`, updatedAt: CURRENT_TIMESTAMP }
            })
    );

export class AccountBalanceRepository extends Context.Service<AccountBalanceRepository>()('@budgie/contracts/AccountBalanceRepository', {
    make: Effect.succeed({
        getLedgerBalances: Effect.fn('AccountBalanceRepository.getLedgerBalances')(function* (accountIds: number[]) {
            const results = yield* Db.query(db =>
                db
                    .select({ accountId: TransactionEntryEntityTable.accountId, balance: getTransactionsSumSql().mapWith(Number) })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                    .where(
                        and(
                            isNull(TransactionEntryEntityTable.deletedAt),
                            transactionFilters.buildVisibleTransactionCondition(),
                            getBalanceLedgerEntryConditionSql(),
                            inArray(TransactionEntryEntityTable.accountId, accountIds)
                        )
                    )
                    .groupBy(TransactionEntryEntityTable.accountId)
            );

            return new Map(results.map(({ accountId, balance }) => [accountId, balance]));
        }),
        getDebtLedgerAmounts: (accountIds: number[]) => {
            const getDebtEventDirectionSumSql = (direction: DebtEventDirectionEnum) =>
                sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${direction} THEN ${DebtEventEntityTable.amount} ELSE 0 END), 0)`.mapWith(
                    Number
                );

            return Db.query(db =>
                db
                    .select({
                        accountId: DebtEventEntityTable.debtAccountId,
                        openedAmount: getDebtEventDirectionSumSql(DebtEventDirectionEnum.OPEN),
                        closedAmount: getDebtEventDirectionSumSql(DebtEventDirectionEnum.CLOSE)
                    })
                    .from(DebtEventEntityTable)
                    .where(and(inArray(DebtEventEntityTable.debtAccountId, accountIds), isNull(DebtEventEntityTable.deletedAt)))
                    .groupBy(DebtEventEntityTable.debtAccountId)
            );
        },
        getLedgerBalanceUntil: (accountId: number, operatedUntil: Date) =>
            Db.query(db =>
                db
                    .select({ balance: sql<number>`COALESCE(${getTransactionsSumSql()}, 0)`.mapWith(Number) })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                    .where(
                        and(
                            eq(TransactionEntryEntityTable.accountId, accountId),
                            isNull(TransactionEntryEntityTable.deletedAt),
                            lte(TransactionEntityTable.operatedAt, operatedUntil),
                            transactionFilters.buildVisibleTransactionCondition(),
                            getBalanceLedgerEntryConditionSql()
                        )
                    )
            ).pipe(Effect.map(([row]) => row.balance)),
        bulkUpsert,
        upsert: (balance: Pick<AccountBalanceCreateEntityInterface, 'accountId' | 'amount'>) => bulkUpsert([balance]),
        getByAccountIds: (accountIds: number[]) =>
            Db.query(db => db.select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds))),
        truncate: () => Db.query(db => db.delete(AccountBalanceEntityTable)),
        truncateExceptBankAuthoritative: () =>
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
            ),
        getAssetClassTotals: (defaultInstrumentId: number) => {
            const fiatExchangeRateSql = buildFiatExchangeRateConversionSql(defaultInstrumentId);
            const cryptoExchangeRateSql = buildStrictExchangeRateConversionSql(defaultInstrumentId);
            const balanceSql = getAccountBalanceWithTransactionsSql();

            return Db.query(db =>
                db
                    .select({
                        fiatTotal: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN (${balanceSql}) * ${fiatExchangeRateSql} ELSE 0 END), 0)`,
                        cryptoTotal: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN (${balanceSql}) * ${cryptoExchangeRateSql} ELSE 0 END), 0)`,
                        fiatCount: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`,
                        cryptoCount: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`
                    })
                    .from(AccountEntityTable)
                    .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)))
            );
        },
        getTotalByCryptoInstrument: (instrumentId: number) =>
            Db.query(db =>
                db
                    .select({ balance: sql<number>`COALESCE(SUM(${getAccountBalanceWithTransactionsSql()}), 0)` })
                    .from(AccountEntityTable)
                    .where(
                        getActiveAccountWhereSql(
                            inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES),
                            eq(AccountEntityTable.instrumentId, instrumentId)
                        )
                    )
            ),
        getHomeAccountRows: (defaultInstrumentId: number) => {
            const balanceSql = getAccountBalanceWithTransactionsSql();
            const exchangeRateSql = buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
            const convertedBalanceSql = sql<number>`COALESCE((${balanceSql}) * ${exchangeRateSql}, 0)`;
            const convertedTargetBalanceSql = getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
            const debtProgressSql = getDebtProgressSql(null, null, AccountEntityTable.targetBalance);
            const convertedDebtProgressSql = getDebtProgressSql(defaultInstrumentId, exchangeRateSql, convertedTargetBalanceSql);

            return Db.query(db =>
                db
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
                        hasLedgerHistory: sql<number>`EXISTS (SELECT 1 FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id} AND ${TransactionEntryEntityTable.deletedAt} IS NULL)`,
                        instrument: InstrumentEntityTable,
                        integrationLabel: BankIntegrationEntityTable.label
                    })
                    .from(AccountEntityTable)
                    .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                    .leftJoin(SyncEntityTable, and(eq(SyncEntityTable.accountId, AccountEntityTable.id), isNull(SyncEntityTable.deletedAt)))
                    .leftJoin(
                        BankIntegrationEntityTable,
                        and(
                            eq(BankIntegrationEntityTable.id, AccountEntityTable.integrationId),
                            isNull(BankIntegrationEntityTable.deletedAt)
                        )
                    )
                    .where(isNull(AccountEntityTable.deletedAt))
            );
        },
        getLatestUpdatedAt: () =>
            Db.query(db =>
                db
                    .select({ updatedAt: sql<Date | null>`MAX(${AccountBalanceEntityTable.updatedAt})` })
                    .from(AccountBalanceEntityTable)
                    .where(isNull(AccountBalanceEntityTable.deletedAt))
            ),
        getByAccountId: (accountId: number) =>
            Db.query(db =>
                db
                    .select({ balance: getAccountBalanceWithTransactionsSql(sql`${accountId}`) })
                    .from(AccountEntityTable)
                    .where(eq(AccountEntityTable.id, accountId))
                    .limit(1)
            ),
        getDebtAccountProgressByAccountId: (accountId: number) =>
            Db.query(db =>
                db
                    .select(getDebtProgressSql(null, null, AccountEntityTable.targetBalance, sql`${accountId}`))
                    .from(AccountEntityTable)
                    .where(eq(AccountEntityTable.id, accountId))
                    .limit(1)
            ),
        getArchivedAccountBalance: (accountId: number) => {
            const totalBalanceSql = sql<number>`
                COALESCE((
                    SELECT ${getTransactionsSumSql()}
                    FROM ${TransactionEntryEntityTable} INNER JOIN ${TransactionEntityTable} ON ${sql`${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}`}
                    WHERE ${sql`${TransactionEntryEntityTable.accountId} = ${accountId}`}
                      AND ${sql`${TransactionEntryEntityTable.deletedAt} IS NULL`}
                      AND ${sql`${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}`}
                      AND ${transactionFilters.buildVisibleTransactionCondition()}
                      AND ${getBalanceLedgerEntryConditionSql()}
                ), 0)`;

            return Db.query(db =>
                db.select({ balance: totalBalanceSql }).from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).limit(1)
            );
        },
        getNetWorth: (defaultInstrumentId: number) => {
            const exchangeRateSql = buildNetWorthExchangeRateConversionSql(defaultInstrumentId);

            return Db.query(db =>
                db
                    .select({
                        netWorth: sql<number>`COALESCE(SUM((${getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)`
                    })
                    .from(AccountEntityTable)
                    .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)))
            );
        },
        getTotalByAccountType: (defaultInstrumentId: number, accountType: AccountTypeEnum) => {
            const isCryptoAccountType = CRYPTO_ACCOUNT_TYPES.includes(accountType);
            const exchangeRateSql = isCryptoAccountType
                ? buildStrictExchangeRateConversionSql(defaultInstrumentId)
                : buildFiatExchangeRateConversionSql(defaultInstrumentId);

            return Db.query(db =>
                db
                    .select({ total: sql<number>`COALESCE(SUM((${getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
                    .from(AccountEntityTable)
                    .where(getActiveAccountWhereSql(eq(AccountEntityTable.type, accountType)))
            );
        },
        getLiquidTotal: (defaultInstrumentId: number, isCryptoIncluded: boolean) => {
            const exchangeRateSql = buildNetWorthExchangeRateConversionSql(defaultInstrumentId);
            const accountTypes = isCryptoIncluded ? [...LIQUID_ACCOUNT_TYPES, ...CRYPTO_ACCOUNT_TYPES] : LIQUID_ACCOUNT_TYPES;

            return Db.query(db =>
                db
                    .select({ total: sql<number>`COALESCE(SUM((${getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)` })
                    .from(AccountEntityTable)
                    .where(getActiveAccountWhereSql(inArray(AccountEntityTable.type, accountTypes)))
            );
        },
        getTotalRemainingDebtByType: (defaultInstrumentId: number, debtType: AccountDebtTypeEnum) => {
            const exchangeRateSql = buildFiatExchangeRateConversionSql(defaultInstrumentId);
            const convertedTargetBalanceSql = getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
            const debtProgressSql = getDebtProgressSql(defaultInstrumentId, exchangeRateSql, convertedTargetBalanceSql);

            return Db.query(db =>
                db
                    .select({ total: sql<number>`COALESCE(SUM(${debtProgressSql.outstandingAmount}), 0)` })
                    .from(AccountEntityTable)
                    .where(
                        getActiveAccountWhereSql(
                            eq(AccountEntityTable.type, AccountTypeEnum.DEBT),
                            eq(AccountEntityTable.debtType, debtType)
                        )
                    )
            );
        }
    })
}) {
    static readonly layer = Layer.effect(AccountBalanceRepository, AccountBalanceRepository.make);
}
