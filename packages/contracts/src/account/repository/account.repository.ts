import { and, count, desc, eq, inArray, isNotNull, isNull, like, ne, notInArray, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../constant/bank-authoritative-account-types.constant';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';
import { AccountFilterInterface } from '../interface/account-filter.interface';
import { AccountEntityTable } from '../table/account-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { SQL } from 'drizzle-orm';

export class AccountRepository {
    readonly create = Effect.fn('AccountRepository.create')(function* (this: AccountRepository, input: AccountCreateEntityInterface) {
        const [account] = yield* this.bulkCreate([input]);

        return account;
    });

    readonly findByIds = Effect.fn('AccountRepository.findByIds')(function* (this: AccountRepository, ids: number[]) {
        return yield* this.findActiveByIds(ids);
    });

    readonly findByIdsExceptBankAuthoritative = Effect.fn('AccountRepository.findByIdsExceptBankAuthoritative')(function* (
        this: AccountRepository,
        ids: number[]
    ) {
        return yield* this.findActiveByIds(ids, notInArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES));
    });

    readonly findByExternalIds = Effect.fn('AccountRepository.findByExternalIds')(function* (externalIds: string[]) {
        if (!isNotEmptyArray(externalIds)) {
            return [];
        }

        return yield* Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(inArray(AccountEntityTable.externalId, externalIds), isNull(AccountEntityTable.deletedAt))
            })
        );
    });

    readonly findByIbans = Effect.fn('AccountRepository.findByIbans')(function* (ibans: string[]) {
        if (!isNotEmptyArray(ibans)) {
            return [];
        }

        return yield* Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(inArray(AccountEntityTable.iban, ibans), isNull(AccountEntityTable.deletedAt))
            })
        );
    });

    private readonly findActiveByIds = Effect.fnUntraced(function* (ids: number[], typeCondition?: SQL) {
        if (!isNotEmptyArray(ids)) {
            return [];
        }

        return yield* Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(inArray(AccountEntityTable.id, ids), isNull(AccountEntityTable.deletedAt), typeCondition)
            })
        );
    });

    constructor(private db: DB) {}

    readonly updateById = (id: number, input: AccountUpdateEntityInterface) =>
        Db.query(db =>
            db
                .update(AccountEntityTable)
                .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
                .where(eq(AccountEntityTable.id, id))
                .returning()
        ).pipe(Effect.map(([account]) => account));

    readonly archiveById = (id: number) =>
        Db.query(db => db.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id)));

    readonly restoreById = (id: number) =>
        Db.query(db => db.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id)));

    readonly deleteById = (id: number) => Db.query(db => db.delete(AccountEntityTable).where(eq(AccountEntityTable.id, id)));

    readonly getAllActiveAccounts = () => Db.query(db => db.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt)));

    readonly getAllActiveAccountsExceptBankAuthoritative = () =>
        Db.query(db =>
            db
                .select()
                .from(AccountEntityTable)
                .where(and(isNull(AccountEntityTable.deletedAt), notInArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES)))
        );

    readonly getAll = () =>
        Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
                with: { [AccountAssociationEnum.INSTRUMENT]: true }
            })
        );

    readonly findByIdIncludingArchived = (id: number) =>
        Db.query(db =>
            db.query.AccountEntityTable.findFirst({
                where: eq(AccountEntityTable.id, id),
                with: { [AccountAssociationEnum.INSTRUMENT]: true }
            })
        );

    readonly findByExternalSource = (externalSource: ExternalSourceEnum) =>
        Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(eq(AccountEntityTable.externalSource, externalSource), isNull(AccountEntityTable.deletedAt))
            })
        );

    readonly bulkCreate = (inputs: AccountCreateEntityInterface[]) =>
        Db.query(db =>
            db
                .insert(AccountEntityTable)
                .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
                .returning()
        );

    readonly touchUpdatedAt = (accountIds: number[]) =>
        Db.query(db => db.update(AccountEntityTable).set({ updatedAt: new Date() }).where(inArray(AccountEntityTable.id, accountIds)));

    readonly truncate = () => Db.query(db => db.delete(AccountEntityTable));

    count() {
        return this.db.select({ count: count() }).from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));
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

    findById(id: number, db: DB = this.db) {
        return db.query.AccountEntityTable.findFirst({
            where: and(eq(AccountEntityTable.id, id), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findByIntegrationId(integrationId: number) {
        return this.db.query.AccountEntityTable.findMany({
            where: and(eq(AccountEntityTable.integrationId, integrationId), isNull(AccountEntityTable.deletedAt)),
            with: { [AccountAssociationEnum.INSTRUMENT]: true }
        });
    }

    findByIban(iban: string) {
        return this.db.query.AccountEntityTable.findFirst({
            where: and(eq(AccountEntityTable.iban, iban), isNull(AccountEntityTable.deletedAt))
        });
    }

    private buildSearchWhereClause(search: string, filter: AccountFilterInterface) {
        const { debtType, excludeTypes, includeTypes, excludeAccountId, onlyActive } = filter;

        return and(
            isNull(AccountEntityTable.parentId),
            isNull(AccountEntityTable.deletedAt),
            like(AccountEntityTable.titleSearch, `%${search.toLowerCase()}%`),
            isNotEmptyArray(includeTypes) ? inArray(AccountEntityTable.type, includeTypes) : sql`1=1`,
            isNotEmptyArray(excludeTypes) ? notInArray(AccountEntityTable.type, excludeTypes) : sql`1=1`,
            isDefined(debtType) ? eq(AccountEntityTable.debtType, debtType) : sql`1=1`,
            isDefined(excludeAccountId) ? ne(AccountEntityTable.id, excludeAccountId) : sql`1=1`,
            onlyActive === true ? eq(AccountEntityTable.isActive, true) : sql`1=1`
        );
    }
}
