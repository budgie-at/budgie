import { type SQL, and, asc, eq, gt, inArray, isNotNull, isNull, like, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
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
import type { YieldFieldsInterface } from '../interface/yield-fields.interface';
import type { YieldTagCandidateQueryInterface } from '../interface/yield-tag-candidate-query.interface';

export class TransactionYieldRepository extends Context.Service<TransactionYieldRepository>()(
    '@budgie/contracts/TransactionYieldRepository',
    {
        make: Effect.sync(() => {
            const buildUnclassifiedYieldCondition = (query: YieldTagCandidateQueryInterface) =>
                and(
                    transactionFilters.buildVisibleTransactionCondition(),
                    isNull(TransactionEntityTable.yieldKind),
                    inArray(TransactionEntityTable.type, [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE]),
                    or(
                        isNotNull(TransactionEntityTable.fundAccountId),
                        inArray(TransactionEntityTable.title, [...query.titles]),
                        ...query.externalIdPrefixes.map(prefix => like(TransactionEntityTable.externalId, `${prefix}%`))
                    )
                );

            const selectCandidates = (where: SQL | undefined, limit: number) =>
                Db.query(db =>
                    db
                        .select({
                            id: TransactionEntityTable.id,
                            type: TransactionEntityTable.type,
                            externalId: TransactionEntityTable.externalId,
                            title: TransactionEntityTable.title,
                            fundAccountId: TransactionEntityTable.fundAccountId,
                            isFundInZone:
                                sql<number>`COALESCE((SELECT ${AccountEntityTable.syncZone} FROM ${AccountEntityTable} WHERE ${AccountEntityTable.id} = ${TransactionEntityTable.fundAccountId}) = ${TransactionEntityTable.syncZone}, 0)`.mapWith(
                                    Boolean
                                )
                        })
                        .from(TransactionEntityTable)
                        .where(where)
                        .orderBy(asc(TransactionEntityTable.id))
                        .limit(limit)
                );

            return {
                findLastDepositBalanceEventAt: Effect.fn('TransactionYieldRepository.findLastDepositBalanceEventAt')(function* (
                    depositAccountId: number
                ) {
                    const isInterest = sql`(${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} AND ${TransactionEntityTable.yieldKind} = ${YieldKindEnum.INTEREST})`;
                    const [row] = yield* Db.query(db =>
                        db
                            .select({
                                lastBalanceEventAt: sql<
                                    number | null
                                >`MAX(CASE WHEN ${TransactionEntityTable.type} IN (${TransactionTypeEnum.ADJUSTMENT}, ${TransactionTypeEnum.TRANSFER}) OR ${isInterest} THEN ${TransactionEntityTable.operatedAt} END)`
                            })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .where(
                                and(
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    transactionFilters.buildLedgerEntryCondition(),
                                    eq(TransactionEntryEntityTable.accountId, depositAccountId)
                                )
                            )
                    );

                    return isDefined(row.lastBalanceEventAt)
                        ? DateTime.toDateUtc(DateTime.makeUnsafe(row.lastBalanceEventAt * 1000))
                        : null;
                }),
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
                            .select({
                                accountCount: sql<number>`COUNT(*)`.mapWith(Number),
                                zoneCount: sql<number>`COUNT(DISTINCT ${AccountEntityTable.syncZone})`.mapWith(Number)
                            })
                            .from(AccountEntityTable)
                            .where(
                                and(inArray(AccountEntityTable.id, [firstAccountId, secondAccountId]), isNull(AccountEntityTable.deletedAt))
                            )
                    ).pipe(
                        Effect.map(([row]) => row.accountCount === new Set([firstAccountId, secondAccountId]).size && row.zoneCount === 1)
                    ),
                clearCrossZoneSources: Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ yieldSourceAccountId: null, updatedAt: new Date() })
                        .where(
                            and(
                                isNotNull(TransactionEntityTable.yieldSourceAccountId),
                                sql`NOT EXISTS (SELECT 1 FROM ${AccountEntityTable} WHERE ${AccountEntityTable.id} = ${TransactionEntityTable.yieldSourceAccountId} AND ${AccountEntityTable.deletedAt} IS NULL AND ${AccountEntityTable.syncZone} = ${TransactionEntityTable.syncZone})`
                            )
                        )
                ).pipe(Effect.asVoid),
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
                    ),
                findUntaggedCandidatesAfter: (query: YieldTagCandidateQueryInterface, afterId: number, limit: number) =>
                    selectCandidates(and(buildUnclassifiedYieldCondition(query), gt(TransactionEntityTable.id, afterId)), limit),
                findUntaggedCandidatesBySyncIds: Effect.fn('TransactionYieldRepository.findUntaggedCandidatesBySyncIds')(function* (
                    query: YieldTagCandidateQueryInterface,
                    syncIds: readonly string[]
                ) {
                    const candidates = [];

                    for (let start = 0; start < syncIds.length; start += 500) {
                        candidates.push(
                            ...(yield* selectCandidates(
                                and(
                                    buildUnclassifiedYieldCondition(query),
                                    inArray(TransactionEntityTable.syncId, syncIds.slice(start, start + 500))
                                ),
                                500
                            ))
                        );
                    }

                    return candidates;
                }),
                fillYieldTags: (transactionId: number, fields: YieldFieldsInterface) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set(fields)
                            .where(and(eq(TransactionEntityTable.id, transactionId), isNull(TransactionEntityTable.yieldKind)))
                    ).pipe(Effect.asVoid)
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionYieldRepository, TransactionYieldRepository.make);
}
