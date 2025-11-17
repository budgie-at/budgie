import { eq } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { AccountBalanceCreateEntityInterface } from '../entity/account-balance-create-entity.interface';
import { AccountBalanceUpdateEntityInterface } from '../entity/account-balance-update-entity.interface';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

import type { AccountBalanceEntityInterface } from '../entity/account-balance-entity.interface';

export class AccountBalanceRepository {
    constructor(private db: DB) {}

    async create(input: AccountBalanceCreateEntityInterface, tx?: TX): Promise<AccountBalanceEntityInterface> {
        const [accountBalance] = await (tx ?? this.db).insert(AccountBalanceEntityTable).values([input]).returning();

        return accountBalance;
    }

    async updateByAccountId(accountId: number, input: AccountBalanceUpdateEntityInterface, tx?: TX): Promise<AccountBalanceEntityInterface> {
        const [accountBalance] = await (tx ?? this.db)
            .update(AccountBalanceEntityTable)
            .set(input)
            .where(eq(AccountBalanceEntityTable.accountId, accountId))
            .returning();

        return accountBalance;
    }

    findByAccountId(id: number): Promise<AccountBalanceEntityInterface | undefined> {
        return this.db.query.AccountBalanceEntityTable.findFirst({ where: eq(AccountBalanceEntityTable.accountId, id) });
    }
}
