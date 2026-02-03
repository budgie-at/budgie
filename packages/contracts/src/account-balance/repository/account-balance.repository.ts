/* eslint-disable max-lines -- Repository with complex SQL aggregation queries */
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    constructor(private db: DB) {}

    // TODO: change to bulkUpsert when drizzle is updated to the latest version
    async upsert(input: AccountBalanceCreateEntityInterface, tx?: TX): Promise<AccountBalanceEntityInterface> {
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

    async getByAccountIds(accountIds: number[]): Promise<AccountBalanceEntityInterface[]> {
        return await this.db.select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    getAllBalances() {
        return this.db.select().from(AccountBalanceEntityTable);
    }

    async getNewTransactionEntriesDeltas(accountIds: number[]): Promise<Map<number, number>> {
        const results = await this.db
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
        const latestBalanceSql = sql<number>`
            COALESCE((
                SELECT ${AccountBalanceEntityTable.amount}
                FROM ${AccountBalanceEntityTable}
                WHERE ${AccountBalanceEntityTable.accountId} = ${accountId}
                LIMIT 1
            ), 0)`;

        const lastBalanceUpdatedAtSql = sql`
            SELECT MAX(${AccountBalanceEntityTable.updatedAt})
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = ${accountId}`;

        const transactionsDeltaSql = sql<number>`
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                        THEN -${TransactionEntryEntityTable.amount}
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                        THEN ${TransactionEntryEntityTable.amount}
                        ELSE 0
                    END
                )
                FROM ${TransactionEntryEntityTable}
                WHERE ${TransactionEntryEntityTable.accountId} = ${accountId}
                  AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                  AND (
                      (${lastBalanceUpdatedAtSql}) IS NULL
                      OR ${TransactionEntryEntityTable.createdAt} > (${lastBalanceUpdatedAtSql})
                  )
            ), 0)`;

        return this.db
            .select({
                balance: sql<number>`${latestBalanceSql} + ${transactionsDeltaSql}`
            })
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.accountId, accountId))
            .limit(1);
    }

    getArchivedAccountBalance(accountId: number) {
        const totalBalanceSql = sql<number>`
            COALESCE((
                SELECT ${this.getTransactionsSumSql()}
                FROM ${TransactionEntryEntityTable}
                WHERE ${TransactionEntryEntityTable.accountId} = ${accountId}
            ), 0)`;

        return this.db
            .select({
                balance: totalBalanceSql
            })
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.accountId, accountId))
            .limit(1);
    }

    getNetWorth(defaultInstrumentId: number) {
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        const netWorthSubquerySql = sql<number>`
            COALESCE(
                (
                    SELECT SUM(
                        (${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}
                    )
                    FROM ${AccountEntityTable}
                    WHERE ${AccountEntityTable.includeInNetWorth} = 1
                      AND ${AccountEntityTable.deletedAt} IS NULL
                ),
                0
            )
        `;

        return this.db
            .select({
                netWorth: netWorthSubquerySql
            })
            .from(TransactionEntryEntityTable)
            .limit(1);
    }

    // jscpd:ignore-start
    getTotalByAccountType(defaultInstrumentId: number, accountType: string) {
        const instrumentIdRef = sql.raw('accounts.instrument_id');
        const exchangeRateSql = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;

        const totalSubquerySql = sql<number>`
            COALESCE(
                (
                    SELECT SUM(
                        (${this.getAccountBalanceWithTransactionsSql()}) * ${exchangeRateSql}
                    )
                    FROM ${AccountEntityTable}
                    WHERE ${AccountEntityTable.type} = ${accountType}
                      AND ${AccountEntityTable.isActive} = 1
                      AND ${AccountEntityTable.deletedAt} IS NULL
                ),
                0
            )
        `;

        return this.db
            .select({
                total: totalSubquerySql
            })
            .from(TransactionEntryEntityTable)
            .limit(1);
    }

    getTotalByBankProvider(defaultInstrumentId: number, provider: ExternalSourceEnum) {
        const totalSubquerySql = sql<number>`
            COALESCE(
                (
                    SELECT SUM(
                        (
                            COALESCE((
                                SELECT amount
                                FROM account_balances
                                WHERE account_id = a.id
                                LIMIT 1
                            ), 0)
                            +
                            COALESCE((
                                SELECT SUM(
                                    CASE
                                        WHEN type = ${TransactionEntryTypeEnum.CREDIT} THEN -amount
                                        WHEN type = ${TransactionEntryTypeEnum.DEBIT} THEN amount
                                        ELSE 0
                                    END
                                )
                                FROM transaction_entries te
                                WHERE te.account_id = a.id
                                  AND te.deleted_at IS NULL
                                  AND te.created_at > COALESCE(
                                      (SELECT MAX(updated_at) FROM account_balances WHERE account_id = a.id),
                                      '1970-01-01'
                                  )
                            ), 0)
                        )
                        *
                        COALESCE(
                            (
                                SELECT rate * 1.0
                                FROM exchange_rates
                                WHERE base_instrument_id = a.instrument_id
                                  AND quote_instrument_id = ${defaultInstrumentId}
                                  AND deleted_at IS NULL
                                ORDER BY created_at DESC
                                LIMIT 1
                            ),
                            (
                                SELECT 1.0 / rate
                                FROM exchange_rates
                                WHERE base_instrument_id = ${defaultInstrumentId}
                                  AND quote_instrument_id = a.instrument_id
                                  AND deleted_at IS NULL
                                ORDER BY created_at DESC
                                LIMIT 1
                            ),
                            1.0
                        )
                    )
                    FROM accounts a
                    INNER JOIN bank_syncs bs ON bs.account_id = a.id
                    WHERE bs.provider = ${provider}
                      AND bs.deleted_at IS NULL
                      AND a.is_active = 1
                      AND a.deleted_at IS NULL
                ),
                0
            )
        `;
        // jscpd:ignore-end

        return this.db
            .select({
                total: totalSubquerySql
            })
            .from(TransactionEntryEntityTable)
            .limit(1);
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(AccountBalanceEntityTable);
    }

    private getAccountBalanceWithTransactionsSql() {
        const latestAccountBalanceSql = sql<number>`
            SELECT ${AccountBalanceEntityTable.amount}
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
            LIMIT 1`;

        const lastBalanceUpdatedAtSql = sql`
            SELECT MAX(${AccountBalanceEntityTable.updatedAt})
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
        `;

        const transactionsSumSinceLastBalanceSql = sql<number>`
            SELECT ${this.getTransactionsSumSql()}
            FROM ${TransactionEntryEntityTable}
            WHERE ${TransactionEntryEntityTable.accountId} = accounts.id
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
