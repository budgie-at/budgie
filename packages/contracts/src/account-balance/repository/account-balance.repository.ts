import { and, desc, inArray, isNull, sql } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';
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

    async getLatestSnapshots(accountIds: number[]): Promise<AccountBalanceEntityInterface[]> {
        const results = await this.db
            .select()
            .from(AccountBalanceEntityTable)
            .where(inArray(AccountBalanceEntityTable.accountId, accountIds))
            .orderBy(AccountBalanceEntityTable.accountId, desc(AccountBalanceEntityTable.createdAt))
            .limit(accountIds.length);

        const map = new Map<number, AccountBalanceEntityInterface>();

        for (const row of results) {
            if (!map.has(row.accountId)) {
                map.set(row.accountId, row);
            }
        }

        return Array.from(map.values());
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
}
