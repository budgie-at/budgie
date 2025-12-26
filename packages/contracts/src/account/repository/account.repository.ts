import { and, count, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

import type { AccountEntityInterface } from '../entity/account-entity.interface';

export class AccountRepository {
    constructor(private db: DB) {}

    async hasAnyAccount(): Promise<boolean> {
        const result = await this.db
            .select({ count: count() })
            .from(AccountEntityTable)
            .where(isNull(AccountEntityTable.deletedAt))
            .limit(1);

        return result[0].count > 0;
    }

    async create(input: AccountCreateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await this.bulkCreate([input], tx);

        return account;
    }

    count() {
        return this.db.select({ count: count() }).from(AccountEntityTable);
    }

    async updateById(id: number, input: AccountUpdateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await (tx ?? this.db).update(AccountEntityTable).set(input).where(eq(AccountEntityTable.id, id)).returning();

        return account;
    }

    async restoreById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id));
    }

    async archiveById(id: number, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await (tx ?? this.db)
            .update(AccountEntityTable)
            .set({ deletedAt: new Date() })
            .where(eq(AccountEntityTable.id, id))
            .returning();

        return account;
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

    async findByExternalId(externalId: string): Promise<AccountEntityInterface | undefined> {
        return await this.db.query.AccountEntityTable.findFirst({
            where: and(eq(AccountEntityTable.externalId, externalId), isNull(AccountEntityTable.deletedAt))
        });
    }

    async findByExternalIds(externalIds: string[]): Promise<AccountEntityInterface[]> {
        return await this.db.query.AccountEntityTable.findMany({
            where: and(inArray(AccountEntityTable.externalId, externalIds), isNull(AccountEntityTable.deletedAt))
        });
    }

    async bulkCreate(inputs: AccountCreateEntityInterface[], tx?: TX): Promise<AccountEntityInterface[]> {
        return await (tx ?? this.db).insert(AccountEntityTable).values(inputs).returning();
    }

    async truncate(): Promise<void> {
        await this.db.delete(AccountEntityTable);
    }
}
