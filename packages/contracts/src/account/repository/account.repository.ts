import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { PRECISION } from '../../generic/constant/precision.constant';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
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
                netWorth: sql<number>`
        COALESCE(
        SUM(
            COALESCE(
              (
                SELECT ${AccountBalanceEntityTable.amount}
                FROM ${AccountBalanceEntityTable}
                WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
                ORDER BY ${AccountBalanceEntityTable.createdAt} DESC
                LIMIT 1
              ),
              accounts.current_balance
            )
            +
            COALESCE(
              (
                SELECT SUM(
                  CASE
                    WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                      THEN ${TransactionEntryEntityTable.amount}
                    WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                      THEN -${TransactionEntryEntityTable.amount}
                    ELSE 0
                  END
                )
                FROM ${TransactionEntryEntityTable}
                WHERE ${TransactionEntryEntityTable.accountId} = accounts.id
                  AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                  AND ${TransactionEntryEntityTable.createdAt} > (
                    SELECT COALESCE(MAX(${AccountBalanceEntityTable.createdAt}), '1970-01-01')
                    FROM ${AccountBalanceEntityTable}
                    WHERE ${AccountBalanceEntityTable.accountId} = accounts.id
                  )
              ),
              0
            )
            *
            COALESCE(
              (
                SELECT ${ExchangeRateEntityTable.rate} * 1.0 / ${PRECISION}
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = accounts.instrument_id
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
              ),
              (
                SELECT ${PRECISION} * 1.0 / ${ExchangeRateEntityTable.rate}
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = accounts.instrument_id
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
              ),
              1.0
            )
          ),
          0
        )
      `
            })
            .from(AccountEntityTable)
            .where(and(eq(AccountEntityTable.includeInNetWorth, true), isNull(AccountEntityTable.deletedAt)));
    }

    getAccountBalance(accountId: number){
        return this.db
            .select({
                balance: sql<number>`
                    COALESCE(
                      COALESCE(
                        (
                          SELECT amount
                          FROM ${AccountBalanceEntityTable}
                          WHERE account_id = accounts.id
                          ORDER BY createdAt DESC
                          LIMIT 1
                        ),
                        accounts.current_balance
                      )
                      + COALESCE(
                        (
                          SELECT SUM(
                            CASE
                              WHEN type = ${TransactionEntryTypeEnum.DEBIT}  THEN amount
                              WHEN type = ${TransactionEntryTypeEnum.CREDIT} THEN -amount
                              ELSE 0
                            END
                          )
                          FROM ${TransactionEntryEntityTable}
                          WHERE account_id = accounts.id
                            AND deletedAt IS NULL
                            AND createdAt > (
                              SELECT COALESCE(MAX(createdAt), '1970-01-01')
                              FROM ${AccountBalanceEntityTable}
                              WHERE account_id = accounts.id
                            )
                        ),
                        0
                      ),
                      0
                    )
                `
            })
            .from(AccountEntityTable)
            .where(and(eq(AccountEntityTable.id, accountId), isNull(AccountEntityTable.deletedAt)))
            .limit(1);
    }
}
