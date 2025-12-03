import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { PRECISION } from '../../generic/constant/precision.constant';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

import type { AccountEntityInterface } from '../entity/account-entity.interface';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';

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
                netWorth: sql<number>`
        COALESCE(
          SUM(
            (
              ${AccountEntityTable.currentBalance} +
              COALESCE(
                (
                  SELECT SUM(
                    CASE
                      WHEN ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.DEBIT}'
                      THEN ${TransactionEntryEntityTable.amount}
                      WHEN ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.CREDIT}'
                      THEN -${TransactionEntryEntityTable.amount}
                    END
                  )
                  FROM ${TransactionEntryEntityTable}
                  WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id}
                ),
                0
              )
            ) *
            CASE
              WHEN ${AccountEntityTable.instrumentId} = ${defaultInstrumentId} THEN 1.0
              ELSE COALESCE(
                (
                  SELECT
                    CASE
                      WHEN ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                      THEN CAST(${ExchangeRateEntityTable.rate} AS REAL) / ${PRECISION}
                      ELSE ${PRECISION} / CAST(${ExchangeRateEntityTable.rate} AS REAL)
                    END
                  FROM ${ExchangeRateEntityTable}
                  WHERE (
                    (${ExchangeRateEntityTable.baseInstrumentId} = ${AccountEntityTable.instrumentId}
                     AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId})
                    OR
                    (${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                     AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${AccountEntityTable.instrumentId})
                  )
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                  LIMIT 1
                ),
                1.0
              )
            END
          ) / ${PRECISION},
          0
        )
      `.as('net_worth')
            })
            .from(AccountEntityTable)
            .where(
                and(
                    eq(AccountEntityTable.includeInNetWorth, true),
                    isNull(AccountEntityTable.deletedAt)
                )
            );
    }

    getNetWorthByAccountId(accountId: number) {
        return this.db
            .select({
                accountId: AccountEntityTable.id,
                accountTitle: AccountEntityTable.title,
                accountType: AccountEntityTable.type,
                instrumentId: AccountEntityTable.instrumentId,
                currentBalance: AccountEntityTable.currentBalance,
                totalDebits: sql<number>`
        COALESCE(
          (
            SELECT SUM(${TransactionEntryEntityTable.amount})
            FROM ${TransactionEntryEntityTable}
            WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id}
              AND ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.DEBIT}'
          ),
          0
        )
      `.as('total_debits'),
                totalCredits: sql<number>`
        COALESCE(
          (
            SELECT SUM(${TransactionEntryEntityTable.amount})
            FROM ${TransactionEntryEntityTable}
            WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id}
              AND ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.CREDIT}'
          ),
          0
        )
      `.as('total_credits'),
                finalBalance: sql<number>`
        ${AccountEntityTable.currentBalance} +
        COALESCE(
          (
            SELECT SUM(
              CASE
                WHEN ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.DEBIT}'
                THEN ${TransactionEntryEntityTable.amount}
                WHEN ${TransactionEntryEntityTable.type} = '${TransactionEntryTypeEnum.CREDIT}'
                THEN -${TransactionEntryEntityTable.amount}
              END
            )
            FROM ${TransactionEntryEntityTable}
            WHERE ${TransactionEntryEntityTable.accountId} = ${AccountEntityTable.id}
          ),
          0
        )
      `.as('final_balance')
            })
            .from(AccountEntityTable)
            .where(
                and(
                    eq(AccountEntityTable.includeInNetWorth, true),
                    eq(AccountEntityTable.id, accountId),
                    isNull(AccountEntityTable.deletedAt)
                )
            );
    }
}
