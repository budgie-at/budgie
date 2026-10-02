import { and, count, desc, eq, inArray, isNotNull, isNull, like, ne, notInArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { BANK_AUTHORITATIVE_ACCOUNT_TYPES } from '../constant/bank-authoritative-account-types.constant';
import { AccountCreateEntityInterface } from '../entity/account-create-entity.interface';
import { AccountUpdateEntityInterface } from '../entity/account-update-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';
import { AccountFilterInterface } from '../interface/account-filter.interface';
import { AccountEntityTable } from '../table/account-entity.table';

import type { SQL } from 'drizzle-orm';

const buildSearchWhereClause = (search: string, filter: AccountFilterInterface) => {
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
};

const bulkCreate = (inputs: AccountCreateEntityInterface[]) =>
    Db.query(db =>
        db
            .insert(AccountEntityTable)
            .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
            .returning()
    );

const findActiveByIds = Effect.fnUntraced(function* (ids: number[], typeCondition?: SQL) {
    if (!isNotEmptyArray(ids)) {
        return [];
    }

    return yield* Db.query(db =>
        db.query.AccountEntityTable.findMany({
            where: and(inArray(AccountEntityTable.id, ids), isNull(AccountEntityTable.deletedAt), typeCondition)
        })
    );
});

export class AccountRepository extends Context.Service<AccountRepository>()('@budgie/contracts/AccountRepository', {
    make: Effect.succeed({
        create: Effect.fn('AccountRepository.create')(function* (input: AccountCreateEntityInterface) {
            const [account] = yield* bulkCreate([input]);

            return account;
        }),
        findByIds: Effect.fn('AccountRepository.findByIds')(function* (ids: number[]) {
            return yield* findActiveByIds(ids);
        }),
        findByIdsExceptBankAuthoritative: Effect.fn('AccountRepository.findByIdsExceptBankAuthoritative')(function* (ids: number[]) {
            return yield* findActiveByIds(ids, notInArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES));
        }),
        findByExternalIds: Effect.fn('AccountRepository.findByExternalIds')(function* (externalIds: string[]) {
            if (!isNotEmptyArray(externalIds)) {
                return [];
            }

            return yield* Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(inArray(AccountEntityTable.externalId, externalIds), isNull(AccountEntityTable.deletedAt))
                })
            );
        }),
        findByIbans: Effect.fn('AccountRepository.findByIbans')(function* (ibans: string[]) {
            if (!isNotEmptyArray(ibans)) {
                return [];
            }

            return yield* Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(inArray(AccountEntityTable.iban, ibans), isNull(AccountEntityTable.deletedAt))
                })
            );
        }),
        updateById: (id: number, input: AccountUpdateEntityInterface) =>
            Db.query(db =>
                db
                    .update(AccountEntityTable)
                    .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
                    .where(eq(AccountEntityTable.id, id))
                    .returning()
            ).pipe(Effect.map(([account]) => account)),
        archiveById: (id: number) =>
            Db.query(db => db.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id))),
        restoreById: (id: number) =>
            Db.query(db => db.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id))),
        deleteById: (id: number) => Db.query(db => db.delete(AccountEntityTable).where(eq(AccountEntityTable.id, id))),
        getAllActiveAccounts: () => Db.query(db => db.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt))),
        getAllActiveAccountsExceptBankAuthoritative: () =>
            Db.query(db =>
                db
                    .select()
                    .from(AccountEntityTable)
                    .where(and(isNull(AccountEntityTable.deletedAt), notInArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES)))
            ),
        getAll: () =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findByIdIncludingArchived: (id: number) =>
            Db.query(db =>
                db.query.AccountEntityTable.findFirst({
                    where: eq(AccountEntityTable.id, id),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findByExternalSource: (externalSource: ExternalSourceEnum) =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(eq(AccountEntityTable.externalSource, externalSource), isNull(AccountEntityTable.deletedAt))
                })
            ),
        bulkCreate,
        touchUpdatedAt: (accountIds: number[]) =>
            Db.query(db => db.update(AccountEntityTable).set({ updatedAt: new Date() }).where(inArray(AccountEntityTable.id, accountIds))),
        truncate: () => Db.query(db => db.delete(AccountEntityTable)),
        count: () => Db.query(db => db.select({ count: count() }).from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt))),
        findBySearchQuery: (search: string, filter: AccountFilterInterface = {}) =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: buildSearchWhereClause(search, filter),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findBySearchQuerySortedByBalance: (search: string, filter: AccountFilterInterface = {}) =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: buildSearchWhereClause(search, filter),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true },
                    orderBy: [
                        desc(AccountEntityTable.isActive),
                        desc(sql`COALESCE((SELECT amount FROM account_balances WHERE account_id = ${AccountEntityTable.id}), 0)`)
                    ]
                })
            ),
        getAllInactive: () =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(
                        isNull(AccountEntityTable.parentId),
                        isNull(AccountEntityTable.deletedAt),
                        eq(AccountEntityTable.isActive, false)
                    ),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        getAllArchived: () =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(isNull(AccountEntityTable.parentId), isNotNull(AccountEntityTable.deletedAt)),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findById: (id: number) =>
            Db.query(db =>
                db.query.AccountEntityTable.findFirst({
                    where: and(eq(AccountEntityTable.id, id), isNull(AccountEntityTable.deletedAt)),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findByIntegrationId: (integrationId: number) =>
            Db.query(db =>
                db.query.AccountEntityTable.findMany({
                    where: and(eq(AccountEntityTable.integrationId, integrationId), isNull(AccountEntityTable.deletedAt)),
                    with: { [AccountAssociationEnum.INSTRUMENT]: true }
                })
            ),
        findByIban: (iban: string) =>
            Db.query(db =>
                db.query.AccountEntityTable.findFirst({
                    where: and(eq(AccountEntityTable.iban, iban), isNull(AccountEntityTable.deletedAt))
                })
            )
    })
}) {
    static readonly layer = Layer.effect(AccountRepository, AccountRepository.make);
}
