/* eslint-disable max-lines -- Repository with complex SQL aggregation queries */
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { DB } from '../../@generic/type/db.type';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncEntityTable } from '../../bank-sync/table/bank-sync-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    constructor(private db: DB) {}

    // TODO: change to bulkUpsert when drizzle is updated to the latest version
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

    getAllBalances() {
        return this.db.select().from(AccountBalanceEntityTable);
    }

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
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    sql`(
                        NOT EXISTS (
                            SELECT 1 FROM ${AccountBalanceEntityTable}
                            WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId}
                        )
                        OR ${TransactionEntryEntityTable.createdAt} > (
                            SELECT MAX(${AccountBalanceEntityTable.updatedAt})
                            FROM ${AccountBalanceEntityTable}
                            WHERE ${AccountBalanceEntityTable.accountId} = ${TransactionEntryEntityTable.accountId}
                        )
                    )`
                )
            )
            .groupBy(TransactionEntryEntityTable.accountId);

        return new Map(results.map(({ accountId, delta }) => [accountId, delta]));
    }

    getByAccountId(accountId: number) {
        return this.db
            .select({
                balance: this.getAccountBalanceWithTransactionsSql(sql`${accountId}`)
            })
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
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        return this.db
            .select({
                netWorth: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)`
            })
            .from(AccountEntityTable)
            .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    // jscpd:ignore-start
    getTotalByAccountType(defaultInstrumentId: number, accountType: AccountTypeEnum) {
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        return this.db
            .select({
                total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)`
            })
            .from(AccountEntityTable)
            .where(
                and(eq(AccountEntityTable.type, accountType), eq(AccountEntityTable.isActive, true), isNull(AccountEntityTable.deletedAt))
            );
    }

    getTotalRemainingDebtByType(defaultInstrumentId: number, debtType: AccountDebtTypeEnum) {
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        const remainingDebtSql = sql<number>`
            MAX(${AccountEntityTable.targetBalance} - (${this.getAccountBalanceWithTransactionsSql()}), 0)
        `;

        return this.db
            .select({
                total: sql<number>`COALESCE(SUM((${remainingDebtSql}) * ${exchangeRateSql}), 0)`
            })
            .from(AccountEntityTable)
            .where(
                and(
                    eq(AccountEntityTable.type, AccountTypeEnum.DEBT),
                    eq(AccountEntityTable.debtType, debtType),
                    eq(AccountEntityTable.isActive, true),
                    isNull(AccountEntityTable.deletedAt)
                )
            );
    }

    getTotalByBankProvider(defaultInstrumentId: number, provider: ExternalSourceEnum) {
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        return this.db
            .select({
                total: sql<number>`COALESCE(SUM((${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}), 0)`
            })
            .from(AccountEntityTable)
            .innerJoin(BankSyncEntityTable, eq(BankSyncEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    eq(BankSyncEntityTable.provider, provider),
                    isNull(BankSyncEntityTable.deletedAt),
                    eq(AccountEntityTable.isActive, true),
                    isNull(AccountEntityTable.deletedAt)
                )
            );
    }
    // jscpd:ignore-end

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable);
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
              AND (
                  (${lastBalanceUpdatedAtSql}) IS NULL
                  OR ${TransactionEntryEntityTable.createdAt} > (${lastBalanceUpdatedAtSql})
              )
        `;

        return sql<number>`COALESCE((${latestAccountBalanceSql}), 0) + COALESCE((${transactionsSumSinceLastBalanceSql}), 0)`;
    }

    private getTransactionsSumSql() {
        return sql<number>`
            SUM(
                   CASE
                   WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                   THEN -${TransactionEntryEntityTable.amount}
                   WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                   THEN ${TransactionEntryEntityTable.amount}
                   ELSE 0
                   END
               )
        `;
    }
}
