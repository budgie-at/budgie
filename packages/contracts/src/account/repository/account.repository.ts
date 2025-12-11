import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { PRECISION } from '../../generic/constant/precision.constant';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

import type { AccountEntityInterface } from '../entity/account-entity.interface';

export class AccountRepository {
    constructor(private db: DB) {}

    async create(input: AccountCreateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await (tx ?? this.db).insert(AccountEntityTable).values([input]).returning();

        return account;
    }

    async updateById(id: number, input: AccountUpdateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await (tx ?? this.db).update(AccountEntityTable).set(input).where(eq(AccountEntityTable.id, id)).returning();

        return account;
    }

    async restoreById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id));
    }

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id));
    }

    async getAllActiveAccounts(): Promise<AccountEntityInterface[]> {
        return await this.db.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));
    }

    findBySearchQuery(search: string) {
        return this.db.query.AccountEntityTable.findMany({
            where: and(
                isNull(AccountEntityTable.parentId),
                isNull(AccountEntityTable.deletedAt),
                sql`LOWER (${AccountEntityTable.title}) LIKE ${`%${search.toLowerCase()}%`}`
            ),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    getAll() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    getAllArchived() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNotNull(AccountEntityTable.deletedAt))
        });
    }

    findByType(type: AccountTypeEnum) {
        return this.db.query.AccountEntityTable.findMany({
            where: and(eq(AccountEntityTable.type, type), isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt))
        });
    }

    async findByParentId(id: number) {
        return await this.db.query.AccountEntityTable.findMany({
            where: and(eq(AccountEntityTable.parentId, id), isNull(AccountEntityTable.deletedAt))
        });
    }

    findById(id: number) {
        return this.db.query.AccountEntityTable.findFirst({
            where: and(eq(AccountEntityTable.id, id), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    getNetWorth(defaultInstrumentId: number) {
        return this.db
            .select({
                netWorth: sql<bigint>`
                COALESCE(
                    CAST(
                        SUM(
                            COALESCE(
                                (
                                    SELECT "amount"
                                    FROM "account_balances"
                                    WHERE "account_id" = "accounts"."id"
                                    ORDER BY "createdAt" DESC
                                    LIMIT 1
                                ),
                                "accounts"."current_balance"
                            )
                            +
                            COALESCE(
                                (
                                    SELECT SUM(
                                        CASE
                                            WHEN "type" = ${TransactionEntryTypeEnum.DEBIT}  THEN "amount"
                                            WHEN "type" = ${TransactionEntryTypeEnum.CREDIT} THEN -"amount"
                                            ELSE 0
                                        END
                                    )
                                    FROM "transaction_entries"
                                    WHERE "transaction_entries"."account_id" = "accounts"."id"
                                      AND "transaction_entries"."deletedAt" IS NULL
                                      AND "transaction_entries"."createdAt" > (
                                        SELECT COALESCE(MAX("createdAt"), '1970-01-01')
                                        FROM "account_balances"
                                        WHERE "account_id" = "accounts"."id"
                                      )
                                ),
                                0
                            )
                            *
                            COALESCE(
                                (
                                    SELECT "rate" * 1.0 / ${PRECISION}
                                    FROM "exchange_rates"
                                    WHERE "base_instrument_id"  = "accounts"."instrument_id"
                                      AND "quote_instrument_id" = ${defaultInstrumentId}
                                      AND "deletedAt" IS NULL
                                    ORDER BY "createdAt" DESC
                                    LIMIT 1
                                ),
                                (
                                    SELECT ${PRECISION} * 1.0 / "rate"
                                    FROM "exchange_rates"
                                    WHERE "base_instrument_id"  = ${defaultInstrumentId}
                                      AND "quote_instrument_id" = "accounts"."instrument_id"
                                      AND "deletedAt" IS NULL
                                    ORDER BY "createdAt" DESC
                                    LIMIT 1
                                ),
                                1.0
                            )
                        ) AS BIGINT
                    ),
                    0
                )
            `
            })
            .from(AccountEntityTable)
            .where(sql`"include_in_net_worth" = 1 AND "deletedAt" IS NULL`);
    }

    getAccountBalance(accountId: number) {
        return this.db
            .select({
                balance: sql<bigint>`
                COALESCE(
                    COALESCE(
                        (
                            SELECT "amount"
                            FROM "account_balances"
                            WHERE "account_id" = ${accountId}
                            ORDER BY "createdAt" DESC
                            LIMIT 1
                        ),
                        "accounts"."current_balance"
                    )
                    +
                    COALESCE(
                        (
                            SELECT SUM(
                                CASE
                                    WHEN "type" = ${TransactionEntryTypeEnum.DEBIT}  THEN "amount"
                                    WHEN "type" = ${TransactionEntryTypeEnum.CREDIT} THEN -"amount"
                                    ELSE 0
                                END
                            )
                            FROM "transaction_entries"
                            WHERE "transaction_entries"."account_id" = ${accountId}
                              AND "transaction_entries"."deletedAt" IS NULL

                              AND "transaction_entries"."createdAt" > (
                                SELECT COALESCE(MAX("createdAt"), '1970-01-01')
                                FROM "account_balances"
                                WHERE "account_id" = ${accountId}
                              )
                        ),
                        0
                    ),
                    0
                )
            `
            })
            .from(AccountEntityTable)
            .where(
                and(
                    eq(AccountEntityTable.id, accountId),
                    eq(AccountEntityTable.includeInNetWorth, true),
                    isNull(AccountEntityTable.deletedAt)
                )
            )
            .limit(1);
    }
}
