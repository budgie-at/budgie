/* eslint-disable max-lines -- File owns the account-balance ledger and valuation SQL pipeline that must stay together */
import { type SQL, type SQLWrapper, and, asc, eq, inArray, isNull, lte, not, notInArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { getExchangeRateWithHistoricalFallbackSql } from '../../@generic/utils/get-exchange-rate-sql.util';
import { roundToMinorUnitSql } from '../../@generic/utils/round-to-minor-unit-sql.util';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../../account/constant/bank-authoritative-account-types.constant';
import { CRYPTO_ACCOUNT_TYPES } from '../../account/constant/crypto-account-types.constant';
import { LIQUID_ACCOUNT_TYPES } from '../../account/constant/liquid-account-types.constant';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { isUnitAccountSql } from '../../account/utils/is-unit-account-sql.util';
import { BankIntegrationEntityTable } from '../../bank-integration/table/bank-integration-entity.table';
import { SyncRecordTypeEnum } from '../../cloud-sync/enum/sync-record-type.enum';
import { buildDuplicateOfOwnAccountSql } from '../../cloud-sync/utils/build-duplicate-of-own-account-sql.util';
import { buildHouseholdOwnershipSql } from '../../cloud-sync/utils/build-household-ownership-sql.util';
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
import { getDebtLedgerBalance } from '../utils/get-debt-ledger-balance.util';

import type { DB } from '../../@generic/type/db.type';
import type { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import type { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';

const getTransactionsSumSql = () =>
    sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE} THEN -${TransactionEntryEntityTable.amount} WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount} ELSE 0 END)`;

const getConvertedBalanceSql = (balanceSql: SQL | SQLWrapper, exchangeRateSql: SQL | SQLWrapper) =>
    roundToMinorUnitSql(sql`(${balanceSql}) * ${exchangeRateSql}`);

const isAccountOwnedSql = buildHouseholdOwnershipSql(SyncRecordTypeEnum.ACCOUNT);

const getActiveAccountWhereSql = (...conditions: SQL[]) =>
    and(...conditions, eq(AccountEntityTable.isActive, true), isNull(AccountEntityTable.deletedAt));

const getConvertedDebtTargetBalanceSql = (defaultInstrumentId: number, exchangeRateSql: SQL | SQLWrapper) =>
    sql<number>`CASE WHEN ${AccountEntityTable.targetBaseInstrumentId} = ${defaultInstrumentId} AND ${AccountEntityTable.targetBaseAmount} IS NOT NULL THEN ${AccountEntityTable.targetBaseAmount} ELSE COALESCE(${AccountEntityTable.targetBalance} * ${exchangeRateSql}, 0) END`;

const buildDebtProgressFromTotals = (
    eventOpenedAmountSql: SQL | SQLWrapper,
    eventClosedAmountSql: SQL | SQLWrapper,
    targetAmountSql: SQL | SQLWrapper
) => {
    const openedAmountSql = sql<number>`MAX((CASE WHEN (${eventOpenedAmountSql}) > 0 THEN (${eventOpenedAmountSql}) ELSE (${targetAmountSql}) END), 0)`;
    const closedAmountSql = sql<number>`MAX((${eventClosedAmountSql}), 0)`;

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

const getDebtProgressSql = (targetAmountSql: SQL | SQLWrapper, accountIdReference = sql.raw('accounts.id')) => {
    const getDebtEventAmountSumSql = (direction: DebtEventDirectionEnum) =>
        sql<number>`SELECT COALESCE(SUM(${DebtEventEntityTable.amount}), 0) FROM ${DebtEventEntityTable} WHERE ${DebtEventEntityTable.debtAccountId} = ${accountIdReference} AND ${DebtEventEntityTable.deletedAt} IS NULL AND ${DebtEventEntityTable.direction} = ${direction}`;

    return buildDebtProgressFromTotals(
        getDebtEventAmountSumSql(DebtEventDirectionEnum.OPEN),
        getDebtEventAmountSumSql(DebtEventDirectionEnum.CLOSE),
        targetAmountSql
    );
};

const getAccountBalanceWithTransactionsSql = (accountIdReference = sql.raw('accounts.id')) => {
    const latestAccountBalanceSql = sql<number>`SELECT ${AccountBalanceEntityTable.amount} FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference} LIMIT 1`;
    const lastBalanceUpdatedAtSql = sql`SELECT MAX(${AccountBalanceEntityTable.updatedAt}) FROM ${AccountBalanceEntityTable} WHERE ${AccountBalanceEntityTable.accountId} = ${accountIdReference}`;
    const transactionsSumSinceLastBalanceSql = sql<number>`SELECT ${getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} CROSS JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${accountIdReference} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${transactionFilters.buildVisibleTransactionCondition()} AND ${transactionFilters.buildRefundAwareLedgerEntryCondition()} AND ${TransactionEntryEntityTable.createdAt} > COALESCE((${lastBalanceUpdatedAtSql}), -1)`;

    const ledgerSumSql = sql<number>`CASE WHEN ${inArray(sql.raw('accounts.type'), BANK_AUTHORITATIVE_ACCOUNT_TYPES)} THEN 0 ELSE COALESCE((${transactionsSumSinceLastBalanceSql}), 0) END`;

    const setupBalanceSql = sql<number>`SELECT ${SyncEntityTable.setupBalance} FROM ${SyncEntityTable} WHERE ${SyncEntityTable.accountId} = ${accountIdReference} AND ${SyncEntityTable.mode} = ${SyncModeEnum.BACKWARD} AND ${SyncEntityTable.deletedAt} IS NULL`;

    return sql<number>`COALESCE((${setupBalanceSql}), COALESCE((${latestAccountBalanceSql}), 0) + ${ledgerSumSql})`;
};

const buildInstrumentRatesCte = (db: DB, defaultInstrumentId: number) => {
    const distinctInstruments = db
        .$with('distinct_account_instruments')
        .as(
            db
                .selectDistinct({ instrumentId: AccountEntityTable.instrumentId })
                .from(AccountEntityTable)
                .where(isNull(AccountEntityTable.deletedAt))
        );
    const instrumentRates = db.$with('account_instrument_rates').as(
        db
            .select({
                instrumentId: distinctInstruments.instrumentId,
                strictRate: getExchangeRateWithHistoricalFallbackSql(
                    defaultInstrumentId,
                    sql.raw('distinct_account_instruments.instrument_id')
                ).as('strict_rate')
            })
            .from(distinctInstruments)
            .groupBy(distinctInstruments.instrumentId)
    );

    return { distinctInstruments, instrumentRates };
};

const buildResolvedAccountBalancesCte = (db: DB) => {
    const deltaEntriesSql = sql<number>`SELECT ${getTransactionsSumSql()} FROM ${TransactionEntryEntityTable} CROSS JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId} WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id} AND ${TransactionEntryEntityTable.deletedAt} IS NULL AND ${transactionFilters.buildVisibleTransactionCondition()} AND ${transactionFilters.buildRefundAwareLedgerEntryCondition()} AND ${TransactionEntryEntityTable.createdAt} > COALESCE(${AccountBalanceEntityTable.updatedAt}, -1)`;
    const ledgerSumSql = sql<number>`CASE WHEN ${inArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES)} THEN 0 ELSE COALESCE((${deltaEntriesSql}), 0) END`;
    const setupBalanceSql = sql<
        number | null
    >`CASE WHEN ${SyncEntityTable.mode} = ${SyncModeEnum.BACKWARD} AND ${SyncEntityTable.deletedAt} IS NULL THEN ${SyncEntityTable.setupBalance} ELSE NULL END`;

    return db.$with('resolved_account_balances').as(
        db
            .select({
                accountId: AccountEntityTable.id,
                balance: sql<number>`COALESCE(${setupBalanceSql}, COALESCE(${AccountBalanceEntityTable.amount}, 0) + ${ledgerSumSql})`.as(
                    'resolved_balance'
                )
            })
            .from(AccountEntityTable)
            .leftJoin(AccountBalanceEntityTable, eq(AccountBalanceEntityTable.accountId, AccountEntityTable.id))
            .leftJoin(SyncEntityTable, and(eq(SyncEntityTable.accountId, AccountEntityTable.id), isNull(SyncEntityTable.deletedAt)))
            .where(isNull(AccountEntityTable.deletedAt))
            .groupBy(AccountEntityTable.id)
    );
};

const buildNetWorthRateFromCteSql = (strictRateColumn: SQLWrapper) =>
    sql<number | null>`CASE WHEN ${isUnitAccountSql()} THEN ${strictRateColumn} ELSE COALESCE(${strictRateColumn}, 1.0) END`;

const buildFiatRateFromCteSql = (strictRateColumn: SQLWrapper) => sql<number>`COALESCE(${strictRateColumn}, 1.0)`;

const buildDebtAggregatesCte = (
    db: DB,
    defaultInstrumentId: number,
    instrumentRates: ReturnType<typeof buildInstrumentRatesCte>['instrumentRates']
) => {
    const netWorthRateSql = buildNetWorthRateFromCteSql(instrumentRates.strictRate);
    const fiatRateSql = buildFiatRateFromCteSql(instrumentRates.strictRate);
    const buildConvertedAmountSql = (rateSql: SQL) =>
        sql<number>`CASE WHEN ${DebtEventEntityTable.baseInstrumentId} = ${defaultInstrumentId} AND ${DebtEventEntityTable.baseAmount} IS NOT NULL THEN ${DebtEventEntityTable.baseAmount} ELSE COALESCE(${DebtEventEntityTable.amount} * ${rateSql}, 0) END`;

    return db.$with('debt_event_aggregates').as(
        db
            .select({
                accountId: DebtEventEntityTable.debtAccountId,
                openAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.OPEN} THEN ${DebtEventEntityTable.amount} ELSE 0 END), 0)`.as(
                        'open_amount'
                    ),
                closeAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.CLOSE} THEN ${DebtEventEntityTable.amount} ELSE 0 END), 0)`.as(
                        'close_amount'
                    ),
                convertedOpenAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.OPEN} THEN ${buildConvertedAmountSql(netWorthRateSql)} ELSE 0 END), 0)`.as(
                        'converted_open_amount'
                    ),
                convertedCloseAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.CLOSE} THEN ${buildConvertedAmountSql(netWorthRateSql)} ELSE 0 END), 0)`.as(
                        'converted_close_amount'
                    ),
                fiatConvertedOpenAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.OPEN} THEN ${buildConvertedAmountSql(fiatRateSql)} ELSE 0 END), 0)`.as(
                        'fiat_converted_open_amount'
                    ),
                fiatConvertedCloseAmount:
                    sql<number>`COALESCE(SUM(CASE WHEN ${DebtEventEntityTable.direction} = ${DebtEventDirectionEnum.CLOSE} THEN ${buildConvertedAmountSql(fiatRateSql)} ELSE 0 END), 0)`.as(
                        'fiat_converted_close_amount'
                    )
            })
            .from(DebtEventEntityTable)
            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, DebtEventEntityTable.debtAccountId))
            .leftJoin(instrumentRates, eq(instrumentRates.instrumentId, AccountEntityTable.instrumentId))
            .where(isNull(DebtEventEntityTable.deletedAt))
            .groupBy(DebtEventEntityTable.debtAccountId)
    );
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

const getDebtLedgerAmounts = (accountIds: number[]) => {
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
};

const queryConvertedBalanceSum = (defaultInstrumentId: number, whereCondition: SQL | undefined) =>
    Db.query(db => {
        const { distinctInstruments, instrumentRates } = buildInstrumentRatesCte(db, defaultInstrumentId);
        const resolvedBalances = buildResolvedAccountBalancesCte(db);
        const exchangeRateSql = buildNetWorthRateFromCteSql(instrumentRates.strictRate);

        return db
            .with(distinctInstruments, instrumentRates, resolvedBalances)
            .select({
                total: sql<number>`COALESCE(SUM(${getConvertedBalanceSql(resolvedBalances.balance, exchangeRateSql)}), 0)`
            })
            .from(AccountEntityTable)
            .innerJoin(resolvedBalances, eq(resolvedBalances.accountId, AccountEntityTable.id))
            .leftJoin(instrumentRates, eq(instrumentRates.instrumentId, AccountEntityTable.instrumentId))
            .where(whereCondition);
    });

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
                            transactionFilters.buildRefundAwareLedgerEntryCondition(),
                            inArray(TransactionEntryEntityTable.accountId, accountIds)
                        )
                    )
                    .groupBy(TransactionEntryEntityTable.accountId)
            );

            return new Map(results.map(({ accountId, balance }) => [accountId, balance]));
        }),
        getDebtLedgerBalances: Effect.fn('AccountBalanceRepository.getDebtLedgerBalances')(function* (
            debtAccounts: Pick<AccountEntityInterface, 'id' | 'debtType' | 'targetBalance'>[]
        ) {
            if (isEmptyArray(debtAccounts)) {
                return new Map<number, number>();
            }

            const ledgerAmounts = yield* getDebtLedgerAmounts(debtAccounts.map(({ id }) => id));
            const ledgerAmountsMap = new Map(ledgerAmounts.map(ledgerAmount => [ledgerAmount.accountId, ledgerAmount]));

            return new Map(
                debtAccounts.map(({ id, debtType, targetBalance }) => {
                    const ledgerAmount = ledgerAmountsMap.get(id);
                    const openedAmount = ledgerAmount?.openedAmount ?? 0;

                    return [
                        id,
                        getDebtLedgerBalance(
                            ledgerAmount?.closedAmount ?? 0,
                            debtType,
                            isPositiveNumber(openedAmount) ? openedAmount : targetBalance
                        )
                    ];
                })
            );
        }),
        getMinimumLedgerBalanceFrom: (accountId: number, operatedFrom: Date) =>
            Db.query(db =>
                db.get<{ balance: number }>(sql`
                    WITH entries AS (
                        SELECT ${TransactionEntityTable.operatedAt} AS operated_at,
                            ${TransactionEntityTable.id} AS transaction_id,
                            ${TransactionEntryEntityTable.id} AS entry_id,
                            CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                                THEN ${TransactionEntryEntityTable.amount}
                                WHEN ${TransactionEntryEntityTable.type} IN (${TransactionEntryTypeEnum.CREDIT}, ${TransactionEntryTypeEnum.FEE})
                                THEN -${TransactionEntryEntityTable.amount} ELSE 0 END AS amount
                        FROM ${TransactionEntryEntityTable}
                        INNER JOIN ${TransactionEntityTable} ON ${TransactionEntityTable.id} = ${TransactionEntryEntityTable.transactionId}
                        WHERE ${and(
                            eq(TransactionEntryEntityTable.accountId, accountId),
                            isNull(TransactionEntryEntityTable.deletedAt),
                            transactionFilters.buildVisibleTransactionCondition(),
                            transactionFilters.buildRefundAwareLedgerEntryCondition()
                        )}
                    ), balances AS (
                        SELECT operated_at,
                            SUM(amount) OVER (ORDER BY operated_at, transaction_id, entry_id ROWS UNBOUNDED PRECEDING) AS balance
                        FROM entries
                    )
                    SELECT MIN(balance) AS balance FROM (
                        SELECT COALESCE(SUM(amount), 0) AS balance FROM entries WHERE operated_at <= ${Math.floor(operatedFrom.getTime() / 1000)}
                        UNION ALL
                        SELECT balance FROM balances WHERE operated_at > ${Math.floor(operatedFrom.getTime() / 1000)}
                    )
                `)
            ).pipe(Effect.map(row => row.balance)),
        getLedgerMovements: (accountId: number) =>
            Db.query(db =>
                db
                    .select({
                        transactionId: TransactionEntityTable.id,
                        operatedAt: TransactionEntityTable.operatedAt,
                        externalSource: TransactionEntityTable.externalSource,
                        amount: getTransactionsSumSql().mapWith(Number)
                    })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                    .where(
                        and(
                            eq(TransactionEntryEntityTable.accountId, accountId),
                            isNull(TransactionEntryEntityTable.deletedAt),
                            transactionFilters.buildVisibleTransactionCondition(),
                            transactionFilters.buildRefundAwareLedgerEntryCondition()
                        )
                    )
                    .groupBy(TransactionEntityTable.id)
                    .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id))
            ),
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
                            transactionFilters.buildRefundAwareLedgerEntryCondition()
                        )
                    )
            ).pipe(Effect.map(([row]) => row.balance)),
        bulkUpsert,
        upsert: (balance: Pick<AccountBalanceCreateEntityInterface, 'accountId' | 'amount'>) => bulkUpsert([balance]),
        getByAccountIds: (accountIds: number[]) =>
            Db.query(db => db.select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds))),
        truncate: Db.query(db => db.delete(AccountBalanceEntityTable)),
        truncateExceptBankAuthoritative: Db.query(db =>
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
        getAssetClassTotals: (defaultInstrumentId: number) =>
            Db.query(db => {
                const { distinctInstruments, instrumentRates } = buildInstrumentRatesCte(db, defaultInstrumentId);
                const resolvedBalances = buildResolvedAccountBalancesCte(db);
                const fiatExchangeRateSql = buildNetWorthRateFromCteSql(instrumentRates.strictRate);
                const cryptoExchangeRateSql = instrumentRates.strictRate;

                return db
                    .with(distinctInstruments, instrumentRates, resolvedBalances)
                    .select({
                        fiatTotal: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN ${getConvertedBalanceSql(resolvedBalances.balance, fiatExchangeRateSql)} ELSE 0 END), 0)`,
                        cryptoTotal: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN ${getConvertedBalanceSql(resolvedBalances.balance, cryptoExchangeRateSql)} ELSE 0 END), 0)`,
                        fiatCount: sql<number>`COALESCE(SUM(CASE WHEN ${notInArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`,
                        cryptoCount: sql<number>`COALESCE(SUM(CASE WHEN ${inArray(AccountEntityTable.type, CRYPTO_ACCOUNT_TYPES)} THEN 1 ELSE 0 END), 0)`
                    })
                    .from(AccountEntityTable)
                    .innerJoin(resolvedBalances, eq(resolvedBalances.accountId, AccountEntityTable.id))
                    .leftJoin(instrumentRates, eq(instrumentRates.instrumentId, AccountEntityTable.instrumentId))
                    .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt), isAccountOwnedSql));
            }),
        getTotalByUnitInstrument: (instrumentId: number) =>
            Db.query(db => {
                const resolvedBalances = buildResolvedAccountBalancesCte(db);

                return db
                    .with(resolvedBalances)
                    .select({ balance: sql<number>`COALESCE(SUM(${resolvedBalances.balance}), 0)` })
                    .from(AccountEntityTable)
                    .innerJoin(resolvedBalances, eq(resolvedBalances.accountId, AccountEntityTable.id))
                    .where(getActiveAccountWhereSql(isUnitAccountSql(), eq(AccountEntityTable.instrumentId, instrumentId)));
            }),
        getHomeAccountRows: (defaultInstrumentId: number) =>
            Db.query(db => {
                const { distinctInstruments, instrumentRates } = buildInstrumentRatesCte(db, defaultInstrumentId);
                const resolvedBalances = buildResolvedAccountBalancesCte(db);
                const debtAggregates = buildDebtAggregatesCte(db, defaultInstrumentId, instrumentRates);
                const exchangeRateSql = buildNetWorthRateFromCteSql(instrumentRates.strictRate);
                const convertedBalanceSql = sql<number>`COALESCE(${getConvertedBalanceSql(resolvedBalances.balance, exchangeRateSql)}, 0)`;
                const convertedTargetBalanceSql = getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
                const debtProgressSql = buildDebtProgressFromTotals(
                    sql<number>`COALESCE(${debtAggregates.openAmount}, 0)`,
                    sql<number>`COALESCE(${debtAggregates.closeAmount}, 0)`,
                    AccountEntityTable.targetBalance
                );
                const convertedDebtProgressSql = buildDebtProgressFromTotals(
                    sql<number>`COALESCE(${debtAggregates.convertedOpenAmount}, 0)`,
                    sql<number>`COALESCE(${debtAggregates.convertedCloseAmount}, 0)`,
                    convertedTargetBalanceSql
                );

                return db
                    .with(distinctInstruments, instrumentRates, resolvedBalances, debtAggregates)
                    .select({
                        account: AccountEntityTable,
                        balance: resolvedBalances.balance,
                        sync: SyncEntityTable,
                        convertedBalance: convertedBalanceSql,
                        isValued: sql<boolean>`(${exchangeRateSql}) IS NOT NULL`.mapWith(Boolean),
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
                        isSharedByOther: sql<number>`CASE WHEN NOT ${isAccountOwnedSql} THEN 1 ELSE 0 END`,
                        instrument: InstrumentEntityTable,
                        integrationLabel: BankIntegrationEntityTable.label,
                        integrationProvider: BankIntegrationEntityTable.provider
                    })
                    .from(AccountEntityTable)
                    .innerJoin(resolvedBalances, eq(resolvedBalances.accountId, AccountEntityTable.id))
                    .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                    .leftJoin(instrumentRates, eq(instrumentRates.instrumentId, AccountEntityTable.instrumentId))
                    .leftJoin(debtAggregates, eq(debtAggregates.accountId, AccountEntityTable.id))
                    .leftJoin(SyncEntityTable, and(eq(SyncEntityTable.accountId, AccountEntityTable.id), isNull(SyncEntityTable.deletedAt)))
                    .leftJoin(
                        BankIntegrationEntityTable,
                        and(
                            eq(BankIntegrationEntityTable.id, AccountEntityTable.integrationId),
                            isNull(BankIntegrationEntityTable.deletedAt)
                        )
                    )
                    .where(and(isNull(AccountEntityTable.deletedAt), not(buildDuplicateOfOwnAccountSql())));
            }),
        getLatestUpdatedAt: Db.query(db =>
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
                    .select(getDebtProgressSql(AccountEntityTable.targetBalance, sql`${accountId}`))
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
                      AND ${transactionFilters.buildRefundAwareLedgerEntryCondition()}
                ), 0)`;

            return Db.query(db =>
                db.select({ balance: totalBalanceSql }).from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).limit(1)
            );
        },
        getNetWorth: (defaultInstrumentId: number) =>
            queryConvertedBalanceSum(
                defaultInstrumentId,
                and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt), isAccountOwnedSql)
            ).pipe(Effect.map(rows => rows.map(({ total }) => ({ netWorth: total })))),
        getTotalByAccountType: (defaultInstrumentId: number, accountType: AccountTypeEnum) =>
            queryConvertedBalanceSum(defaultInstrumentId, getActiveAccountWhereSql(eq(AccountEntityTable.type, accountType))),
        getLiquidTotal: (defaultInstrumentId: number, isCryptoIncluded: boolean) => {
            const accountTypes = isCryptoIncluded ? [...LIQUID_ACCOUNT_TYPES, ...CRYPTO_ACCOUNT_TYPES] : LIQUID_ACCOUNT_TYPES;

            return queryConvertedBalanceSum(
                defaultInstrumentId,
                getActiveAccountWhereSql(inArray(AccountEntityTable.type, accountTypes), isAccountOwnedSql)
            );
        },
        getTotalRemainingDebtByType: (defaultInstrumentId: number, debtType: AccountDebtTypeEnum) =>
            Db.query(db => {
                const { distinctInstruments, instrumentRates } = buildInstrumentRatesCte(db, defaultInstrumentId);
                const debtAggregates = buildDebtAggregatesCte(db, defaultInstrumentId, instrumentRates);
                const exchangeRateSql = buildFiatRateFromCteSql(instrumentRates.strictRate);
                const convertedTargetBalanceSql = getConvertedDebtTargetBalanceSql(defaultInstrumentId, exchangeRateSql);
                const debtProgressSql = buildDebtProgressFromTotals(
                    sql<number>`COALESCE(${debtAggregates.fiatConvertedOpenAmount}, 0)`,
                    sql<number>`COALESCE(${debtAggregates.fiatConvertedCloseAmount}, 0)`,
                    convertedTargetBalanceSql
                );

                return db
                    .with(distinctInstruments, instrumentRates, debtAggregates)
                    .select({ total: sql<number>`COALESCE(SUM(${debtProgressSql.outstandingAmount}), 0)` })
                    .from(AccountEntityTable)
                    .leftJoin(instrumentRates, eq(instrumentRates.instrumentId, AccountEntityTable.instrumentId))
                    .leftJoin(debtAggregates, eq(debtAggregates.accountId, AccountEntityTable.id))
                    .where(
                        getActiveAccountWhereSql(
                            eq(AccountEntityTable.type, AccountTypeEnum.DEBT),
                            eq(AccountEntityTable.debtType, debtType)
                        )
                    );
            })
    })
}) {
    static readonly layer = Layer.effect(AccountBalanceRepository, AccountBalanceRepository.make);
}
