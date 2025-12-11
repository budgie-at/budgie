import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { PRECISION } from '../../generic/constant/precision.constant';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    constructor(private db: DB) {}

    async create(input: AccountBalanceCreateEntityInterface, tx?: TX): Promise<AccountBalanceEntityInterface> {
        const [accountBalance] = await (tx ?? this.db).insert(AccountBalanceEntityTable).values([input]).returning();

        return accountBalance;
    }

    async getAccountBalanceSnapshots(accountIds: number[]): Promise<AccountBalanceEntityInterface[]> {
        return await this.db.select().from(AccountBalanceEntityTable).where(inArray(AccountBalanceEntityTable.accountId, accountIds));
    }

    async getNewTransactionEntries(accountIds: number[]): Promise<TransactionEntryEntityInterface[]> {
        return await this.db
            .select()
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    isNull(TransactionEntryEntityTable.deletedAt),
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    sql`
                        ${TransactionEntryEntityTable.createdAt} > (
                            SELECT COALESCE(MAX(ab."createdAt"), '1970-01-01')
                            FROM "account_balances" ab
                            WHERE ab."account_id" = ${TransactionEntryEntityTable.accountId}
                        )
                    `
                )
            );
    }

    async insertSnapshots(snapshots: AccountBalanceCreateEntityInterface[], tx?: TX) {
        await (tx ?? this.db).insert(AccountBalanceEntityTable).values(snapshots);
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

    getAccountBalance(accountId: number) {
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
