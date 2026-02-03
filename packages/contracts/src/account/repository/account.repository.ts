import { and, count, desc, eq, inArray, isNotNull, isNull, like, ne, notInArray, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DB, TX } from '../../@generic/type/db.type';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountFilterInterface } from '../interface/account-filter.interface';
import { AccountEntityTable } from '../table/account-entity.table';

import type { AccountEntityInterface } from '../entity/account-entity.interface';

export class AccountRepository {
    constructor(private db: DB) {}

    async create(input: AccountCreateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await this.bulkCreate([input], tx);

        return account;
    }

    count() {
        return this.db.select({ count: count() }).from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));
    }

    async updateById(id: number, input: AccountUpdateEntityInterface, tx?: TX): Promise<AccountEntityInterface> {
        const [account] = await (tx ?? this.db)
            .update(AccountEntityTable)
            .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
            .where(eq(AccountEntityTable.id, id))
            .returning();

        return account;
    }

    async archiveById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id));
    }

    async restoreById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id));
    }

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(AccountEntityTable).where(eq(AccountEntityTable.id, id));
    }

    async getAllActiveAccounts(): Promise<AccountEntityInterface[]> {
        return await this.db.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));
    }

    findBySearchQuery(search: string, filter: AccountFilterInterface = {}) {
        return this.db.query.AccountEntityTable.findMany({
            where: this.buildSearchWhereClause(search, filter),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findBySearchQuerySortedByBalance(search: string, filter: AccountFilterInterface = {}) {
        return this.db.query.AccountEntityTable.findMany({
            where: this.buildSearchWhereClause(search, filter),
            with: { [AccountAssociationEnum.INSTRUMENT]: true },
            orderBy: [
                desc(AccountEntityTable.isActive),
                desc(sql`COALESCE((SELECT amount FROM account_balances WHERE account_id = ${AccountEntityTable.id}), 0)`)
            ]
        });
    }

    getAll() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findAllWithBankSync() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
            with: {
                [AccountAssociationEnum.INSTRUMENT]: true,
                [AccountAssociationEnum.BANK_SYNC]: true
            }
        });
    }

    getAllInactive() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt), eq(AccountEntityTable.isActive, false)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    getAllArchived() {
        return this.db.query.AccountEntityTable.findMany({
            where: and(isNull(AccountEntityTable.parentId), isNotNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findById(id: number) {
        return this.db.query.AccountEntityTable.findFirst({
            where: and(eq(AccountEntityTable.id, id), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    async findByIds(ids: number[]): Promise<AccountEntityInterface[]> {
        if (!isNotEmptyArray(ids)) {
            return [];
        }

        return await this.db.query.AccountEntityTable.findMany({
            where: and(inArray(AccountEntityTable.id, ids), isNull(AccountEntityTable.deletedAt))
        });
    }

    async findByExternalIds(externalIds: string[]): Promise<AccountEntityInterface[]> {
        if (!isNotEmptyArray(externalIds)) {
            return [];
        }

        return await this.db.query.AccountEntityTable.findMany({
            where: and(inArray(AccountEntityTable.externalId, externalIds), isNull(AccountEntityTable.deletedAt))
        });
    }

    async findByIbans(ibans: string[]): Promise<AccountEntityInterface[]> {
        if (!isNotEmptyArray(ibans)) {
            return [];
        }

        return await this.db.query.AccountEntityTable.findMany({
            where: and(inArray(AccountEntityTable.iban, ibans), isNull(AccountEntityTable.deletedAt))
        });
    }

    async bulkCreate(inputs: AccountCreateEntityInterface[], tx?: TX): Promise<AccountEntityInterface[]> {
        return await (tx ?? this.db)
            .insert(AccountEntityTable)
            .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
            .returning();
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(AccountEntityTable);
    }

    private buildSearchWhereClause(search: string, filter: AccountFilterInterface) {
        const { excludeTypes, excludeAccountId, onlyActive } = filter;

        return and(
            isNull(AccountEntityTable.parentId),
            isNull(AccountEntityTable.deletedAt),
            like(AccountEntityTable.titleSearch, `%${search.toLowerCase()}%`),
            isNotEmptyArray(excludeTypes) ? notInArray(AccountEntityTable.type, excludeTypes) : sql`1=1`,
            isDefined(excludeAccountId) ? ne(AccountEntityTable.id, excludeAccountId) : sql`1=1`,
            onlyActive === true ? eq(AccountEntityTable.isActive, true) : sql`1=1`
        );
    }
}
