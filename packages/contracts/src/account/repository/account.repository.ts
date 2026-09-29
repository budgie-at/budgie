import { subDays } from 'date-fns/subDays';
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, like, ne, notInArray, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
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

    readonly updateById = Effect.fn('AccountRepository.updateById')(function* (id: number, input: AccountUpdateEntityInterface) {
        const [account] = yield* Db.query(db =>
            db
                .update(AccountEntityTable)
                .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
                .where(eq(AccountEntityTable.id, id))
                .returning()
        );

        return account;
    });

    readonly archiveById = Effect.fn('AccountRepository.archiveById')(function* (id: number) {
        yield* Db.query(db => db.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id)));
    });

    readonly restoreById = Effect.fn('AccountRepository.restoreById')(function* (id: number) {
        yield* Db.query(db => db.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id)));
    });

    readonly deleteById = Effect.fn('AccountRepository.deleteById')(function* (id: number) {
        yield* Db.query(db => db.delete(AccountEntityTable).where(eq(AccountEntityTable.id, id)));
    });

    readonly getAllActiveAccounts = Effect.fn('AccountRepository.getAllActiveAccounts')(function* () {
        return yield* Db.query(db => db.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt)));
    });

    readonly getAllActiveAccountsExceptBankAuthoritative = Effect.fn('AccountRepository.getAllActiveAccountsExceptBankAuthoritative')(
        function* () {
            return yield* Db.query(db =>
                db
                    .select()
                    .from(AccountEntityTable)
                    .where(and(isNull(AccountEntityTable.deletedAt), notInArray(AccountEntityTable.type, BANK_AUTHORITATIVE_ACCOUNT_TYPES)))
            );
        }
    );

    readonly getAll = Effect.fn('AccountRepository.getAll')(function* () {
        return yield* Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(isNull(AccountEntityTable.parentId), isNull(AccountEntityTable.deletedAt)),
                with: { [AccountAssociationEnum.INSTRUMENT]: true }
            })
        );
    });

    readonly findByIdIncludingArchived = Effect.fn('AccountRepository.findByIdIncludingArchived')(function* (id: number) {
        return yield* Db.query(db =>
            db.query.AccountEntityTable.findFirst({
                where: eq(AccountEntityTable.id, id),
                with: { [AccountAssociationEnum.INSTRUMENT]: true }
            })
        );
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

    readonly findByExternalSource = Effect.fn('AccountRepository.findByExternalSource')(function* (externalSource: ExternalSourceEnum) {
        return yield* Db.query(db =>
            db.query.AccountEntityTable.findMany({
                where: and(eq(AccountEntityTable.externalSource, externalSource), isNull(AccountEntityTable.deletedAt))
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

    readonly bulkCreate = Effect.fn('AccountRepository.bulkCreate')(function* (inputs: AccountCreateEntityInterface[]) {
        return yield* Db.query(db =>
            db
                .insert(AccountEntityTable)
                .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
                .returning()
        );
    });

    readonly touchUpdatedAt = Effect.fn('AccountRepository.touchUpdatedAt')(function* (accountIds: number[]) {
        yield* Db.query(db =>
            db.update(AccountEntityTable).set({ updatedAt: new Date() }).where(inArray(AccountEntityTable.id, accountIds))
        );
    });

    readonly truncate = Effect.fn('AccountRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(AccountEntityTable));
    });

    readonly findMostActiveByInstrumentAndType = Effect.fn('AccountRepository.findMostActiveByInstrumentAndType')(function* (
        instrumentId: number,
        transactionType: TransactionTypeEnum,
        days: number = 30
    ) {
        const cutoffDate = subDays(new Date(), days);
        const entryType =
            transactionType === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

        const result = yield* Db.query(db =>
            db
                .select({
                    account: AccountEntityTable,
                    transactionCount: count(TransactionEntryEntityTable.id)
                })
                .from(AccountEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                .where(
                    and(
                        eq(AccountEntityTable.isActive, true),
                        isNull(AccountEntityTable.deletedAt),
                        eq(AccountEntityTable.instrumentId, instrumentId),
                        eq(TransactionEntityTable.type, transactionType),
                        isNull(TransactionEntityTable.deletedAt),
                        eq(TransactionEntryEntityTable.type, entryType),
                        gte(TransactionEntityTable.operatedAt, cutoffDate)
                    )
                )
                .groupBy(AccountEntityTable.id)
                .orderBy(desc(count(TransactionEntryEntityTable.id)))
                .limit(1)
        );

        return result[0]?.account;
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
