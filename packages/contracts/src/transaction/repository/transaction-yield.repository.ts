import { and, eq, inArray, isNull, like, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { INVESTMENTS_CATEGORY_ID } from '../../category/constant/investments-category-id.constant';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';
import { YieldKindEnum } from '../enum/yield-kind.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { ExternalSourceEnum } from '../../account/enum/external-source.enum';

export class TransactionYieldRepository extends Context.Service<TransactionYieldRepository>()(
    '@budgie/contracts/TransactionYieldRepository',
    {
        make: Effect.sync(() => ({
            findInterestCandidates: (
                externalSources: readonly ExternalSourceEnum[],
                likePatterns: readonly string[],
                transactionIds: readonly number[] | null
            ) =>
                Db.query(db =>
                    db
                        .select({
                            id: TransactionEntityTable.id,
                            title: TransactionEntityTable.title,
                            comment: TransactionEntityTable.comment,
                            integrationId: AccountEntityTable.integrationId,
                            syncZone: AccountEntityTable.syncZone
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntityTable.toAccountId))
                        .where(
                            and(
                                transactionFilters.buildVisibleTransactionCondition(),
                                eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                                isNull(TransactionEntityTable.yieldKind),
                                inArray(TransactionEntityTable.externalSource, [...externalSources]),
                                or(
                                    ...likePatterns.flatMap(pattern => [
                                        like(TransactionEntityTable.title, pattern),
                                        like(TransactionEntityTable.comment, pattern)
                                    ])
                                ),
                                ...(isDefined(transactionIds) ? [inArray(TransactionEntityTable.id, [...transactionIds])] : [])
                            )
                        )
                ),
            findYieldPositionIds: (integrationId: number, syncZone: string) =>
                Db.query(db =>
                    db
                        .select({ id: AccountEntityTable.id })
                        .from(AccountEntityTable)
                        .where(
                            and(
                                eq(AccountEntityTable.integrationId, integrationId),
                                eq(AccountEntityTable.syncZone, syncZone),
                                inArray(AccountEntityTable.type, [AccountTypeEnum.DEPOSIT, AccountTypeEnum.SAVINGS]),
                                isNull(AccountEntityTable.deletedAt)
                            )
                        )
                ).pipe(Effect.map(rows => rows.map(({ id }) => id))),
            fillMissingYieldCategory: (transactionIds: readonly number[]) =>
                isEmptyArray(transactionIds)
                    ? Effect.void
                    : Db.query(db =>
                          db
                              .update(TransactionEntryEntityTable)
                              .set({ categoryId: INVESTMENTS_CATEGORY_ID, categorySource: CategorySourceEnum.RULE })
                              .where(
                                  and(
                                      inArray(TransactionEntryEntityTable.transactionId, [...transactionIds]),
                                      isNull(TransactionEntryEntityTable.categoryId),
                                      eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY),
                                      ne(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE)
                                  )
                              )
                      ).pipe(Effect.asVoid),
            areAccountsInSameZone: (firstAccountId: number, secondAccountId: number) =>
                Db.query(db =>
                    db
                        .select({ zoneCount: sql<number>`COUNT(DISTINCT ${AccountEntityTable.syncZone})`.mapWith(Number) })
                        .from(AccountEntityTable)
                        .where(inArray(AccountEntityTable.id, [firstAccountId, secondAccountId]))
                ).pipe(Effect.map(([row]) => row.zoneCount === 1)),
            refineImportedYieldKind: (transactionId: number, yieldKind: YieldKindEnum) =>
                Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ yieldKind, updatedAt: new Date() })
                        .where(
                            and(
                                eq(TransactionEntityTable.id, transactionId),
                                or(
                                    isNull(TransactionEntityTable.yieldKind),
                                    eq(TransactionEntityTable.yieldKind, YieldKindEnum.DISTRIBUTION)
                                ),
                                or(
                                    isNull(TransactionEntityTable.updatedBy),
                                    ne(TransactionEntityTable.updatedBy, TransactionUpdatedByEnum.USER)
                                )
                            )
                        )
                )
        }))
    }
) {
    static readonly layer = Layer.effect(TransactionYieldRepository, TransactionYieldRepository.make);
}
