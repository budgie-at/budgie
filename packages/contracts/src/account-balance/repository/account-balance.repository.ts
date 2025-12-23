import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { PRECISION } from '../../generic/constant/precision.constant';
import { DB, TX } from '../../generic/type/db.type';
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
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    isNull(TransactionEntryEntityTable.deletedAt),
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    sql`
                        ${TransactionEntryEntityTable.createdAt} > (
                            SELECT COALESCE(MAX(ab."updated_at"), '1970-01-01')
                            FROM "account_balances" ab
                            WHERE ab."account_id" = ${TransactionEntryEntityTable.accountId}
                        )
                    `
                )
            )
            .groupBy(TransactionEntryEntityTable.accountId);

        return new Map(results.map(({ accountId, delta }) => [accountId, delta]));
    }

    getByAccountId(accountId: number) {
        return this.db
            .select({
                balance: sql<number>`
                COALESCE(${this.getAccountBalanceWithTransactionsSql()}, 0)
            `
            })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }

    getNetWorth(defaultInstrumentId: number) {
        return this.db
            .select({
                netWorth: sql<number>`
                COALESCE(
                    SUM(
                        (
                            ${this.getLatestAccountBalanceSql()}
                            +
                            ${this.getTransactionsSinceLastBalanceOptimizedSql()}
                        )
                        *
                        COALESCE(
                            er_account_direct.rate * 1.0 / ${PRECISION},
                            ${PRECISION} * 1.0 / er_account_inverse.rate,
                            1.0
                        )
                    ),
                    0
                )
            `
            })
            .from(AccountEntityTable)
            .leftJoin(
                sql`${ExchangeRateEntityTable} er_account_direct`,
                this.getAccountExchangeRateDirectJoinConditionSql(defaultInstrumentId)
            )
            .leftJoin(
                sql`${ExchangeRateEntityTable} er_account_inverse`,
                this.getAccountExchangeRateInverseJoinConditionSql(defaultInstrumentId)
            )
            .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    async truncate(): Promise<void> {
        await this.db.delete(AccountBalanceEntityTable);
    }

    private getAccountBalanceWithTransactionsSql() {
        return sql`${this.getLatestAccountBalanceSql()} + ${this.getTransactionsSinceLastBalanceSql()}`;
    }

    private getLatestAccountBalanceSql() {
        return sql`
            COALESCE(
                (
                    SELECT ${AccountBalanceEntityTable.amount}
                    FROM ${AccountBalanceEntityTable}
                    WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
                    LIMIT 1
                ),
                0
            )
    `;
    }

    private getTransactionsSinceLastBalanceSql() {
        return sql`
            COALESCE(
                (
                    SELECT ${this.getTransactionsSumSql()}
                    FROM ${TransactionEntryEntityTable}
                    WHERE ${TransactionEntryEntityTable.accountId} = accounts.id
                        AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                        AND ${TransactionEntryEntityTable.createdAt} > ${this.getLastBalanceUpdatedAtSql()}
                ),
                0
            )
    `;
    }

    private getTransactionsSumSql() {
        return sql<number>`
            SUM(
                (CASE
                    WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                        THEN ${TransactionEntryEntityTable.amount}
                    WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                        THEN -${TransactionEntryEntityTable.amount}
                    ELSE 0
                END)
                *
                COALESCE(
                    ${this.getTransactionEntryDirectExchangeRateSql()},
                    ${this.getTransactionEntryInverseExchangeRateSql()},
                    1.0
                )
            )
        `;
    }

    private getLastBalanceUpdatedAtSql() {
        return sql`
        (
            SELECT COALESCE(MAX(${AccountBalanceEntityTable.updatedAt}), '1970-01-01')
            FROM ${AccountBalanceEntityTable}
            WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
        )
    `;
    }

    private getTransactionEntryDirectExchangeRateSql() {
        return sql`
        (
            SELECT ${ExchangeRateEntityTable.rate} * 1.0 / ${PRECISION}
            FROM ${ExchangeRateEntityTable}
            WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${TransactionEntryEntityTable.instrumentId}
                AND ${ExchangeRateEntityTable.quoteInstrumentId} = accounts.instrument_id
                AND ${ExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
            LIMIT 1
        )
    `;
    }

    private getTransactionEntryInverseExchangeRateSql() {
        return sql`
        (
            SELECT ${PRECISION} * 1.0 / ${ExchangeRateEntityTable.rate}
            FROM ${ExchangeRateEntityTable}
            WHERE ${ExchangeRateEntityTable.baseInstrumentId} = accounts.instrument_id
                AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${TransactionEntryEntityTable.instrumentId}
                AND ${ExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
            LIMIT 1
        )
    `;
    }

    private getTransactionsSinceLastBalanceOptimizedSql() {
        return sql`
            COALESCE(
                (
                    SELECT SUM(
                        (CASE
                            WHEN te.type = ${TransactionEntryTypeEnum.CREDIT}
                                THEN te.amount
                            WHEN te.type = ${TransactionEntryTypeEnum.DEBIT}
                                THEN -te.amount
                            ELSE 0
                        END)
                        *
                        COALESCE(
                            er_te_direct.rate * 1.0 / ${PRECISION},
                            ${PRECISION} * 1.0 / er_te_inverse.rate,
                            1.0
                        )
                    )
                    FROM ${TransactionEntryEntityTable} te
                    LEFT JOIN ${ExchangeRateEntityTable} er_te_direct ON (
                        er_te_direct.base_instrument_id = te.instrument_id
                        AND er_te_direct.quote_instrument_id = ${AccountEntityTable.instrumentId}
                        AND er_te_direct.deleted_at IS NULL
                        AND er_te_direct.id = (
                            SELECT id FROM ${ExchangeRateEntityTable}
                            WHERE base_instrument_id = te.instrument_id
                                AND quote_instrument_id = ${AccountEntityTable.instrumentId}
                                AND deleted_at IS NULL
                            ORDER BY created_at DESC
                            LIMIT 1
                        )
                    )
                    LEFT JOIN ${ExchangeRateEntityTable} er_te_inverse ON (
                        er_te_inverse.base_instrument_id = ${AccountEntityTable.instrumentId}
                        AND er_te_inverse.quote_instrument_id = te.instrument_id
                        AND er_te_inverse.deleted_at IS NULL
                        AND er_te_inverse.id = (
                            SELECT id FROM ${ExchangeRateEntityTable}
                            WHERE base_instrument_id = ${AccountEntityTable.instrumentId}
                                AND quote_instrument_id = te.instrument_id
                                AND deleted_at IS NULL
                            ORDER BY created_at DESC
                            LIMIT 1
                        )
                    )
                    WHERE te.account_id = ${AccountEntityTable.id}
                        AND te.deleted_at IS NULL
                        AND te.created_at > ${this.getLastBalanceUpdatedAtSql()}
                ),
                0
            )
        `;
    }

    private getAccountExchangeRateDirectJoinConditionSql(defaultInstrumentId: number) {
        return sql`er_account_direct.base_instrument_id = ${AccountEntityTable.instrumentId}
            AND er_account_direct.quote_instrument_id = ${defaultInstrumentId}
            AND er_account_direct.deleted_at IS NULL
            AND er_account_direct.id = (
                SELECT id FROM ${ExchangeRateEntityTable}
                WHERE base_instrument_id = ${AccountEntityTable.instrumentId}
                    AND quote_instrument_id = ${defaultInstrumentId}
                    AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            )`;
    }

    private getAccountExchangeRateInverseJoinConditionSql(defaultInstrumentId: number) {
        return sql`er_account_inverse.base_instrument_id = ${defaultInstrumentId}
            AND er_account_inverse.quote_instrument_id = ${AccountEntityTable.instrumentId}
            AND er_account_inverse.deleted_at IS NULL
            AND er_account_inverse.id = (
                SELECT id FROM ${ExchangeRateEntityTable}
                WHERE base_instrument_id = ${defaultInstrumentId}
                    AND quote_instrument_id = ${AccountEntityTable.instrumentId}
                    AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            )`;
    }
}
