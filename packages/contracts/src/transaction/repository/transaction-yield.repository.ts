import { and, asc, eq, gt, gte, inArray, isNotNull, isNull, like, ne, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Array from 'effect/Array';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { INVESTMENTS_CATEGORY_ID } from '../../category/constant/investments-category-id.constant';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { YIELD_POSITION_ACCOUNT_TYPES } from '../../yield/constant/yield-position-account-types.constant';
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
                            toAccountId: TransactionEntityTable.toAccountId,
                            fromAccountId: TransactionEntityTable.fromAccountId
                        })
                        .from(TransactionEntityTable)
                        .where(where)
                        .orderBy(asc(TransactionEntityTable.id))
                        .limit(limit)
                );

            return {
                findDepositYieldTimeline: Effect.fn('TransactionYieldRepository.findDepositYieldTimeline')(function* (accountId: number) {
                    const isInterest = sql`(${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} AND ${TransactionEntityTable.yieldKind} = ${YieldKindEnum.INTEREST})`;
                    const [onDeposit] = yield* Db.query(db =>
                        db
                            .select({
                                lastBalanceEventAt: sql<
                                    number | null
                                >`MAX(CASE WHEN ${TransactionEntityTable.type} IN (${TransactionTypeEnum.ADJUSTMENT}, ${TransactionTypeEnum.TRANSFER}) OR ${isInterest} THEN ${TransactionEntityTable.operatedAt} END)`,
                                firstPrincipalAt: sql<
                                    number | null
                                >`MIN(CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.TRANSFER} AND ${TransactionEntityTable.toAccountId} = ${accountId} THEN ${TransactionEntityTable.operatedAt} END)`,
                                lastInterestAt: sql<
                                    number | null
                                >`MAX(CASE WHEN ${isInterest} AND (${TransactionEntityTable.yieldSourceAccountId} = ${accountId} OR ${TransactionEntityTable.toAccountId} = ${accountId}) THEN ${TransactionEntityTable.operatedAt} END)`
                            })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .where(
                                and(
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    transactionFilters.buildLedgerEntryCondition(),
                                    eq(TransactionEntryEntityTable.accountId, accountId)
                                )
                            )
                    );
                    const [attributed] = yield* Db.query(db =>
                        db
                            .select({
                                lastInterestAt: sql<
                                    number | null
                                >`MAX(CASE WHEN ${isInterest} THEN ${TransactionEntityTable.operatedAt} END)`
                            })
                            .from(TransactionEntityTable)
                            .where(
                                and(
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    eq(TransactionEntityTable.yieldSourceAccountId, accountId),
                                    sql`EXISTS (SELECT 1 FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.originalTransactionId} IS NULL AND ${TransactionEntryEntityTable.deletedAt} IS NULL)`
                                )
                            )
                    );
                    const toDate = (seconds: number | null | undefined) =>
                        isDefined(seconds) ? DateTime.toDateUtc(DateTime.makeUnsafe(seconds * 1000)) : null;
                    const lastInterestSeconds = [onDeposit.lastInterestAt, attributed.lastInterestAt].filter(isDefined);

                    return {
                        lastBalanceEventAt: toDate(onDeposit.lastBalanceEventAt),
                        firstPrincipalAt: toDate(onDeposit.firstPrincipalAt),
                        lastInterestAt: toDate(isNotEmptyArray(lastInterestSeconds) ? Math.max(...lastInterestSeconds) : null)
                    };
                }),
                findUnassignedInterestIds: (depositAccountId: number, since: Date) => {
                    const depositAccount = alias(AccountEntityTable, 'deposit_account');

                    return Db.query(db =>
                        db
                            .select({ id: TransactionEntityTable.id })
                            .from(TransactionEntityTable)
                            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntityTable.toAccountId))
                            .innerJoin(depositAccount, eq(depositAccount.id, depositAccountId))
                            .where(
                                and(
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                                    eq(TransactionEntityTable.yieldKind, YieldKindEnum.INTEREST),
                                    isNull(TransactionEntityTable.yieldSourceAccountId),
                                    notInArray(AccountEntityTable.type, [...YIELD_POSITION_ACCOUNT_TYPES]),
                                    eq(AccountEntityTable.instrumentId, depositAccount.instrumentId),
                                    eq(AccountEntityTable.syncZone, depositAccount.syncZone),
                                    gte(TransactionEntityTable.operatedAt, since),
                                    sql`NOT EXISTS (SELECT 1 FROM ${AccountEntityTable} other WHERE other.id != ${depositAccountId} AND other.type = ${AccountTypeEnum.DEPOSIT}
                                        AND other.instrument_id = ${depositAccount.instrumentId} AND other.sync_zone = ${depositAccount.syncZone} AND (other.deleted_at IS NULL OR other.deleted_at > ${TransactionEntityTable.operatedAt})
                                        AND (other.is_active = 1 OR EXISTS (SELECT 1 FROM account_balances balance WHERE balance.account_id = other.id AND balance.amount != 0) OR EXISTS (SELECT 1 FROM transaction_entries movement INNER JOIN transactions moved ON moved.id = movement.transaction_id WHERE movement.account_id = other.id AND movement.deleted_at IS NULL AND moved.deleted_at IS NULL AND moved.operated_at > ${TransactionEntityTable.operatedAt}))
                                        AND (other.created_at <= ${TransactionEntityTable.operatedAt} OR EXISTS (SELECT 1 FROM ${TransactionEntityTable} principal
                                            WHERE principal.type = ${TransactionTypeEnum.TRANSFER} AND principal.to_account_id = other.id
                                            AND principal.deleted_at IS NULL AND principal.operated_at <= ${TransactionEntityTable.operatedAt})))`
                                )
                            )
                    ).pipe(Effect.map(rows => rows.map(({ id }) => id)));
                },
                linkInterestToDeposit: (depositAccountId: number, transactionIds: readonly number[]) =>
                    isEmptyArray(transactionIds)
                        ? Effect.void
                        : Db.query(db =>
                              db
                                  .update(TransactionEntityTable)
                                  .set({
                                      yieldSourceAccountId: depositAccountId,
                                      updatedBy: TransactionUpdatedByEnum.USER,
                                      updatedAt: new Date()
                                  })
                                  .where(inArray(TransactionEntityTable.id, [...transactionIds]))
                          ).pipe(Effect.asVoid),
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
                fillMissingYieldCategory: Effect.fn('TransactionYieldRepository.fillMissingYieldCategory')((targetIds: readonly number[]) =>
                    Effect.forEach(Array.chunksOf(targetIds, 500), chunk =>
                        Db.query(db =>
                            db
                                .update(TransactionEntryEntityTable)
                                .set({ categoryId: INVESTMENTS_CATEGORY_ID, categorySource: CategorySourceEnum.RULE })
                                .where(
                                    and(
                                        inArray(TransactionEntryEntityTable.transactionId, chunk),
                                        isNull(TransactionEntryEntityTable.categoryId),
                                        eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY),
                                        ne(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE)
                                    )
                                )
                        )
                    ).pipe(Effect.asVoid)
                ),
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
                findUntaggedCandidatesBySyncIds: Effect.fn('TransactionYieldRepository.findUntaggedCandidatesBySyncIds')(
                    (query: YieldTagCandidateQueryInterface, syncIds: readonly string[]) =>
                        Effect.forEach(Array.chunksOf(syncIds, 500), chunk =>
                            selectCandidates(
                                and(buildUnclassifiedYieldCondition(query), inArray(TransactionEntityTable.syncId, chunk)),
                                500
                            )
                        ).pipe(Effect.map(Array.flatten))
                ),
                findYieldCategoryRepairIdsBySyncIds: Effect.fn('TransactionYieldRepository.findYieldCategoryRepairIdsBySyncIds')(
                    (externalIdPrefixes: readonly string[], syncIds: readonly string[]) =>
                        Effect.forEach(Array.chunksOf(syncIds, 500), chunk =>
                            Db.query(db =>
                                db.all<Pick<typeof TransactionEntityTable.$inferSelect, 'id'>>(
                                    sql`SELECT ${TransactionEntityTable.id} FROM ${TransactionEntityTable} WHERE ${transactionFilters.buildVisibleTransactionCondition()} AND ${inArray(TransactionEntityTable.syncId, chunk)}
                                        AND ${inArray(TransactionEntityTable.yieldKind, [YieldKindEnum.STAKING, YieldKindEnum.EARN, YieldKindEnum.DISTRIBUTION])}
                                        AND ${or(...externalIdPrefixes.map(prefix => like(TransactionEntityTable.externalId, `${prefix}%`)))}
                                        AND NOT EXISTS (SELECT 1 FROM ${TransactionEntryEntityTable} WHERE ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id} AND ${TransactionEntryEntityTable.categorySource} = ${CategorySourceEnum.USER})`
                                )
                            )
                        ).pipe(Effect.map(chunks => Array.flatten(chunks).map(row => row.id)))
                ),
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
