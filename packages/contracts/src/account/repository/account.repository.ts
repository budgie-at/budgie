import { and, eq, isNull, sql } from 'drizzle-orm';

import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { DB, TX } from '../../generic/type/db.type';
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

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(AccountEntityTable).where(eq(AccountEntityTable.id, id));
    }

    getAll() {
        return this.db.query.AccountEntityTable.findMany({
            where: isNull(AccountEntityTable.parentId),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findByType(type: AccountTypeEnum) {
        return this.db.query.AccountEntityTable.findMany({
            where: and(eq(AccountEntityTable.type, type), isNull(AccountEntityTable.parentId))
        });
    }

    async findByParentId(id: number) {
        return await this.db.query.AccountEntityTable.findMany({ where: eq(AccountEntityTable.parentId, id) });
    }

    findById(id: number) {
        return this.db.query.AccountEntityTable.findFirst({
            where: eq(AccountEntityTable.id, id),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    calculateTotalBalance() {
        return this.db
            .select({
                total: sql<number>`coalesce(sum(${AccountBalanceEntityTable.amount}), 0)`
            })
            .from(AccountBalanceEntityTable)
            .innerJoin(AccountEntityTable, eq(AccountBalanceEntityTable.accountId, AccountEntityTable.id))
            .where(isNull(AccountEntityTable.deletedAt));
    }
}
