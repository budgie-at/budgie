import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
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

    getNetWorth(defaultInstrumentId: number) {
        const exchangeRateSql = sql`COALESCE(
            ${this.getDirectExchangeRateSql(defaultInstrumentId)},
            ${this.getInverseExchangeRateSql(defaultInstrumentId)},
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

    async truncate(): Promise<void> {
        await this.db.delete(AccountBalanceEntityTable);
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

    private getDirectExchangeRateSql(defaultInstrumentId: number) {
        return sql`
            (
                SELECT ${ExchangeRateEntityTable.rate} * 1.0
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = accounts.instrument_id
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
            )
        `;
    }

    private getInverseExchangeRateSql(defaultInstrumentId: number) {
        return sql`
            (
                SELECT 1.0 / ${ExchangeRateEntityTable.rate}
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = accounts.instrument_id
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
            )
        `;
    }
}
