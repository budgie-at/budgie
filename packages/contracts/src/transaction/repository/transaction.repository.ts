/* eslint-disable max-lines -- Transaction repository is the kitchen sink for tx queries + filter builders + bank-sync helpers */
import { SQL, and, count, eq, gte, inArray, isNotNull, isNull, lt, ne, notExists, notInArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Effect from 'effect/Effect';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { DebtEventAssociationEnum } from '../../debt-event/enum/debt-event-association.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { deriveEmbeddingFlag } from '../util/derive-embedding-flag.util';

import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import type { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';
import type { TransactionUpdateInputInterface } from '../input/transaction-update-input.interface';
import type { ConsolidationSourceRowInterface } from '../interface/consolidation-source-row.interface';
import type { SimilarTransactionMonthRowInterface } from '../interface/similar-transaction-month-row.interface';
import type { SimilarTransactionStatsQueryInterface } from '../interface/similar-transaction-stats-query.interface';

export class TransactionRepository extends BaseTransactionFilterRepository {
    private static readonly TOUCH_CHUNK_SIZE = 500;

    private static readonly NON_INDEXABLE_EMBEDDING_TYPES: TransactionTypeEnum[] = [
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.ADJUSTMENT
    ];

    private static readonly LIVE_ENTRY_RELATION_WHERE = and(
        isNull(TransactionEntryEntityTable.originalTransactionId),
        isNull(TransactionEntryEntityTable.deletedAt)
    );

    private static readonly ENTRIES_WITH_MCC_CATEGORY_RELATIONS = {
        [TransactionAssociationEnum.ENTRIES]: {
            where: TransactionRepository.LIVE_ENTRY_RELATION_WHERE,
            with: { [TransactionEntryAssociationEnum.MCC_CATEGORY]: true }
        }
    } as const;

    readonly bulkCreate = Effect.fn('TransactionRepository.bulkCreate')(function* (inputs: TransactionCreateEntityInterface[]) {
        if (isNotEmptyArray(inputs)) {
            return yield* Db.query(db => db.insert(TransactionEntityTable).values(inputs).returning());
        }

        return [];
    });

    readonly clearAlreadyIndexedMerchantFlags = Effect.fn('TransactionRepository.clearAlreadyIndexedMerchantFlags')(function* () {
        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title != ''
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
                JOIN merchant_embeddings me
                  ON me.title = transactions.title
                  AND me.mcc_description = COALESCE(mcc.full_description, '')
                  AND me.category_id = te.category_id
                  AND me.deleted_at IS NULL
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NOT NULL
              )
        `)
            )
        );
    });

    readonly clearAlreadyIndexedCommentFlags = Effect.fn('TransactionRepository.clearAlreadyIndexedCommentFlags')(function* () {
        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title = ''
              AND comment != ''
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                JOIN comment_embeddings ce
                  ON ce.comment = transactions.comment
                  AND ce.category_id = te.category_id
                  AND ce.deleted_at IS NULL
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NOT NULL
              )
        `)
            )
        );
    });

    readonly findMccCategorySuggestions = Effect.fn('TransactionRepository.findMccCategorySuggestions')(function* (
        mccCategoryId: number,
        limit: number
    ) {
        return yield* Db.query(db =>
            db.$client.getAllAsync<{ categoryId: number; count: number }>(
                `WITH signals AS (
                SELECT me.category_id AS category_id
                FROM merchant_embeddings me
                INNER JOIN mcc_categories mcc ON mcc.full_description = me.mcc_description
                WHERE mcc.id = ? AND me.deleted_at IS NULL
                UNION ALL
                SELECT te.category_id
                FROM transaction_entries te
                INNER JOIN transactions t ON t.id = te.transaction_id
                WHERE te.mcc_category_id = ?
                  AND te.category_id IS NOT NULL
                  AND t.deleted_at IS NULL
                  AND te.deleted_at IS NULL
            )
            SELECT category_id AS categoryId, COUNT(*) AS count
            FROM signals
            WHERE category_id IS NOT NULL
            GROUP BY category_id
            ORDER BY COUNT(*) DESC
            LIMIT ?`,
                [mccCategoryId, mccCategoryId, limit]
            )
        );
    });

    readonly findSimilarStats = Effect.fn('TransactionRepository.findSimilarStats')(function* (
        this: TransactionRepository,
        query: SimilarTransactionStatsQueryInterface
    ) {
        if (!isPositiveNumber(query.accountId) || !isPositiveNumber(query.months)) {
            return null;
        }

        const rows = yield* Db.query(db =>
            db.$client.getAllAsync<SimilarTransactionMonthRowInterface>(
                this.buildSimilarStatsSql(query),
                this.buildSimilarStatsParams(query)
            )
        );

        if (isEmptyArray(rows)) {
            return null;
        }

        const count = rows.reduce((sum, row) => sum + row.count, 0);
        const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
        const firstRow = rows.at(0);
        const currencySymbol = isDefined(firstRow) ? firstRow.currencySymbol : '';

        return {
            count,
            totalAmount,
            averageAmount: count > 0 ? totalAmount / count : 0,
            currencySymbol,
            months: rows
        };
    });

    readonly findExternalIdsByExternalSource = Effect.fn('TransactionRepository.findExternalIdsByExternalSource')(function* (
        externalSource: ExternalSourceEnum
    ) {
        const results = yield* Db.query(db =>
            db
                .select({ externalId: TransactionEntityTable.externalId })
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.externalSource, externalSource),
                        isNotNull(TransactionEntityTable.externalId),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                )
        );

        return results.map(row => row.externalId).filter(isDefined);
    });

    readonly findConsolidationSources = Effect.fn('TransactionRepository.findConsolidationSources')(function* (
        canonicalTransactionId: number,
        language: LanguageEnum
    ) {
        return yield* Db.query(db =>
            db.$client.getAllAsync<ConsolidationSourceRowInterface>(
                `SELECT
                moved.transaction_id AS canonicalTransactionId,
                moved.original_transaction_id AS sourceTransactionId,
                source.type AS sourceType,
                source.title AS sourceTitle,
                source.comment AS sourceComment,
                source.external_id AS sourceExternalId,
                source.external_source AS sourceExternalSource,
                source.operated_at * 1000 AS sourceOperatedAtMs,
                moved.id AS entryId,
                moved.type AS entryType,
                moved.amount AS amount,
                moved.exchange_rate AS exchangeRate,
                account.id AS accountId,
                account.title AS accountTitle,
                account.icon AS accountIcon,
                source_from_account.title AS sourceFromAccountTitle,
                source_from_account.icon AS sourceFromAccountIcon,
                source_to_account.title AS sourceToAccountTitle,
                source_to_account.icon AS sourceToAccountIcon,
                canonical_from_account.title AS canonicalFromAccountTitle,
                canonical_from_account.icon AS canonicalFromAccountIcon,
                canonical_to_account.title AS canonicalToAccountTitle,
                canonical_to_account.icon AS canonicalToAccountIcon,
                instrument.id AS instrumentId,
                instrument.code AS currencyCode,
                instrument.symbol AS currencySymbol,
                COALESCE(
                    (SELECT translation.title
                     FROM default_category_translations translation
                     WHERE translation.category_id = category.id
                       AND translation.language = ?),
                    category.title
                ) AS categoryTitle,
                category.icon AS categoryIcon,
                mcc.mcc AS mcc,
                mcc.short_description AS mccDescription,
                moved.to_iban AS toIban
            FROM transaction_entries moved
            INNER JOIN transactions source ON source.id = moved.original_transaction_id
            INNER JOIN transactions canonical ON canonical.id = moved.transaction_id
            INNER JOIN accounts account ON account.id = moved.account_id
            INNER JOIN instruments instrument ON instrument.id = account.instrument_id
            LEFT JOIN accounts source_from_account ON source_from_account.id = source.from_account_id
            LEFT JOIN accounts source_to_account ON source_to_account.id = source.to_account_id
            LEFT JOIN accounts canonical_from_account ON canonical_from_account.id = canonical.from_account_id
            LEFT JOIN accounts canonical_to_account ON canonical_to_account.id = canonical.to_account_id
            LEFT JOIN categories category ON category.id = moved.category_id
            LEFT JOIN mcc_categories mcc ON mcc.id = moved.mcc_category_id
            WHERE moved.transaction_id = ?
              AND moved.original_transaction_id IS NOT NULL
              AND moved.deleted_at IS NULL
            ORDER BY source.operated_at ASC, source.id ASC, moved.id ASC`,
                [language, canonicalTransactionId]
            )
        );
    });

    readonly findActiveAutoConsolidatedByAccountIds = Effect.fn('TransactionRepository.findActiveAutoConsolidatedByAccountIds')(function* (
        this: TransactionRepository,
        accountIds: number[]
    ) {
        if (isEmptyArray(accountIds)) {
            return [];
        }

        const movedSourceCanonicalIds = this.db
            .select({ transactionId: TransactionEntryEntityTable.transactionId })
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            );

        return yield* Db.query(db =>
            db
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(
                    and(
                        isNotNull(TransactionEntityTable.consolidationType),
                        isNull(TransactionEntityTable.deletedAt),
                        or(
                            inArray(TransactionEntityTable.fromAccountId, accountIds),
                            inArray(TransactionEntityTable.toAccountId, accountIds),
                            inArray(TransactionEntityTable.id, movedSourceCanonicalIds)
                        )
                    )
                )
        );
    });

    readonly findActiveAutoConsolidatedByAccountIdsSince = Effect.fn('TransactionRepository.findActiveAutoConsolidatedByAccountIdsSince')(
        function* (accountIds: number[], since: Date) {
            if (isEmptyArray(accountIds)) {
                return [];
            }
            const sourceTransaction = alias(TransactionEntityTable, 'source_tx');

            return yield* Db.query(db =>
                db
                    .selectDistinct({ id: TransactionEntityTable.id })
                    .from(TransactionEntityTable)
                    .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                    .innerJoin(sourceTransaction, eq(sourceTransaction.id, TransactionEntryEntityTable.originalTransactionId))
                    .where(
                        and(
                            isNotNull(TransactionEntityTable.consolidationType),
                            isNull(TransactionEntityTable.deletedAt),
                            inArray(TransactionEntryEntityTable.accountId, accountIds),
                            isNotNull(TransactionEntryEntityTable.originalTransactionId),
                            isNull(TransactionEntryEntityTable.deletedAt),
                            gte(sourceTransaction.operatedAt, since)
                        )
                    )
            );
        }
    );

    readonly setConsolidationParent = Effect.fn('TransactionRepository.setConsolidationParent')(function* (
        this: TransactionRepository,
        sourceTransactionIds: number[],
        canonicalTransactionId: number
    ) {
        if (isEmptyArray(sourceTransactionIds)) {
            return;
        }

        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: canonicalTransactionId })
                .where(and(inArray(TransactionEntityTable.id, sourceTransactionIds), this.buildVisibleTransactionCondition()))
        );
    });

    readonly setConsolidationType = Effect.fn('TransactionRepository.setConsolidationType')(function* (
        transactionId: number,
        type: TransactionConsolidationTypeEnum | null
    ) {
        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ consolidationType: type })
                .where(and(eq(TransactionEntityTable.id, transactionId), isNull(TransactionEntityTable.consolidationParentTransactionId)))
        );
    });

    readonly clearConsolidationParent = Effect.fn('TransactionRepository.clearConsolidationParent')(function* (
        canonicalTransactionId: number
    ) {
        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: null })
                .where(eq(TransactionEntityTable.consolidationParentTransactionId, canonicalTransactionId))
        );
    });

    readonly touchAndMarkForEmbeddingByIds = Effect.fn('TransactionRepository.touchAndMarkForEmbeddingByIds')(function* (ids: number[]) {
        if (isEmptyArray(ids)) {
            return;
        }

        const { TOUCH_CHUNK_SIZE } = TransactionRepository;

        for (let start = 0; start < ids.length; start += TOUCH_CHUNK_SIZE) {
            const chunk = ids.slice(start, start + TOUCH_CHUNK_SIZE);

            yield* Db.query(db =>
                db
                    .update(TransactionEntityTable)
                    .set({
                        updatedAt: new Date(),
                        needsEmbedding: sql`CASE WHEN ${isNull(TransactionEntityTable.deletedAt)} AND ${notInArray(TransactionEntityTable.type, TransactionRepository.NON_INDEXABLE_EMBEDDING_TYPES)} THEN 1 ELSE ${TransactionEntityTable.needsEmbedding} END`
                    })
                    .where(inArray(TransactionEntityTable.id, chunk))
            );
        }
    });

    readonly touchUpdatedByIds = Effect.fn('TransactionRepository.touchUpdatedByIds')(function* (
        ids: number[],
        updatedBy: TransactionUpdatedByEnum
    ) {
        if (!isNotEmptyArray(ids)) {
            return;
        }

        yield* Db.query(db =>
            db.update(TransactionEntityTable).set({ updatedAt: new Date(), updatedBy }).where(inArray(TransactionEntityTable.id, ids))
        );
    });

    readonly touchUpdatedAt = Effect.fn('TransactionRepository.touchUpdatedAt')(function* (id: number) {
        yield* Db.query(db => db.update(TransactionEntityTable).set({ updatedAt: new Date() }).where(eq(TransactionEntityTable.id, id)));
    });

    readonly create = Effect.fn('TransactionRepository.create')(function* (
        this: TransactionRepository,
        input: TransactionCreateEntityInterface
    ) {
        const [transaction] = yield* this.bulkCreate([input]);

        return transaction;
    });

    readonly deleteById = Effect.fn('TransactionRepository.deleteById')(function* (id: number) {
        yield* Db.query(db => db.delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)));
    });

    readonly updateById = Effect.fn('TransactionRepository.updateById')(function* (id: number, input: TransactionUpdateInputInterface) {
        const finalInput = { ...input, ...deriveEmbeddingFlag(input) };
        const [transaction] = yield* Db.query(db =>
            db.update(TransactionEntityTable).set(finalInput).where(eq(TransactionEntityTable.id, id)).returning()
        );

        if (!isDefined(transaction)) {
            return yield* Effect.die(new Error(`Transaction ${id} not found`));
        }

        return transaction;
    });

    readonly findByIdsWithEntries = Effect.fn('TransactionRepository.findByIdsWithEntries')(function* (ids: number[]) {
        if (!isNotEmptyArray(ids)) {
            return [];
        }

        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                where: inArray(TransactionEntityTable.id, ids),
                with: TransactionRepository.ENTRIES_WITH_MCC_CATEGORY_RELATIONS
            })
        );
    });

    readonly getAllAfter = Effect.fn('TransactionRepository.getAllAfter')(function* (
        this: TransactionRepository,
        cursorId: number | null,
        limit: number
    ) {
        const baseFilter = this.buildVisibleTransactionCondition();
        const where = isDefined(cursorId) ? and(baseFilter, lt(TransactionEntityTable.id, cursorId)) : baseFilter;

        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                with: {
                    [TransactionAssociationEnum.ENTRIES]: {
                        where: TransactionRepository.LIVE_ENTRY_RELATION_WHERE
                    }
                },
                orderBy: (transaction, { desc }) => [desc(transaction.id)],
                limit,
                where
            })
        );
    });

    readonly findAllWithMccCategoryOffset = Effect.fn('TransactionRepository.findAllWithMccCategoryOffset')(function* (
        limit: number,
        offset: number
    ) {
        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                with: TransactionRepository.ENTRIES_WITH_MCC_CATEGORY_RELATIONS,
                orderBy: (transaction, { desc }) => [desc(transaction.id)],
                limit,
                offset,
                where: isNull(TransactionEntityTable.deletedAt)
            })
        );
    });

    readonly getByIdRaw = Effect.fn('TransactionRepository.getByIdRaw')(function* (id: number) {
        return yield* Db.query(db => db.query.TransactionEntityTable.findFirst({ where: eq(TransactionEntityTable.id, id) }));
    });

    readonly getByIdWithEntries = Effect.fn('TransactionRepository.getByIdWithEntries')(function* (id: number) {
        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findFirst({
                where: eq(TransactionEntityTable.id, id),
                with: {
                    [TransactionAssociationEnum.ENTRIES]: {
                        where: TransactionRepository.LIVE_ENTRY_RELATION_WHERE
                    }
                }
            })
        );
    });

    readonly findByIds = Effect.fn('TransactionRepository.findByIds')(function* (this: TransactionRepository, ids: number[]) {
        return yield* this.findByIdsWithEntriesWhere(ids, TransactionRepository.LIVE_ENTRY_RELATION_WHERE);
    });

    readonly findByIdsWithRefundConsolidationHistory = Effect.fn('TransactionRepository.findByIdsWithRefundConsolidationHistory')(
        function* (this: TransactionRepository, ids: number[]) {
            return yield* this.findByIdsWithEntriesWhere(ids, isNull(TransactionEntryEntityTable.deletedAt));
        }
    );

    readonly truncate = Effect.fn('TransactionRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(TransactionEntityTable));
    });

    readonly markAllForEmbedding = Effect.fn('TransactionRepository.markAllForEmbedding')(function* () {
        yield* Db.query(db =>
            db.update(TransactionEntityTable).set({ needsEmbedding: true }).where(isNull(TransactionEntityTable.deletedAt))
        );
    });

    readonly markForEmbeddingByIds = Effect.fn('TransactionRepository.markForEmbeddingByIds')(function* (ids: number[]) {
        if (isEmptyArray(ids)) {
            return;
        }

        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ needsEmbedding: true })
                .where(
                    and(
                        inArray(TransactionEntityTable.id, ids),
                        eq(TransactionEntityTable.needsEmbedding, false),
                        isNull(TransactionEntityTable.deletedAt),
                        notInArray(TransactionEntityTable.type, TransactionRepository.NON_INDEXABLE_EMBEDDING_TYPES)
                    )
                )
        );
    });

    readonly clearNeedsEmbedding = Effect.fn('TransactionRepository.clearNeedsEmbedding')(function* (ids: number[]) {
        if (isEmptyArray(ids)) {
            return;
        }
        const CHUNK = 500;

        for (let start = 0; start < ids.length; start += CHUNK) {
            const chunk = ids.slice(start, start + CHUNK);

            yield* Db.query(db =>
                db
                    .update(TransactionEntityTable)
                    .set({ needsEmbedding: false })
                    .where(and(eq(TransactionEntityTable.needsEmbedding, true), inArray(TransactionEntityTable.id, chunk)))
            );
        }
    });

    readonly clearNonIndexableFlags = Effect.fn('TransactionRepository.clearNonIndexableFlags')(function* () {
        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title = ''
              AND comment = ''
        `)
            )
        );

        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NULL
              )
        `)
            )
        );

        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                INNER JOIN accounts acc ON acc.id = te.account_id
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND acc.type = ${AccountTypeEnum.DEBT}
              )
        `)
            )
        );

        yield* Db.query(db =>
            Promise.resolve(
                db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND type IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.ADJUSTMENT})
        `)
            )
        );
    });

    readonly findIdMapByExternalSource = Effect.fn('TransactionRepository.findIdMapByExternalSource')(function* (
        externalSource: ExternalSourceEnum
    ) {
        const results = yield* Db.query(db =>
            db
                .select({ id: TransactionEntityTable.id, externalId: TransactionEntityTable.externalId })
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.externalSource, externalSource),
                        isNotNull(TransactionEntityTable.externalId),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                )
        );

        return new Map(
            results.flatMap(({ id, externalId }) => {
                if (!isDefined(externalId)) {
                    return [];
                }

                return [[externalId, id] as const];
            })
        );
    });

    readonly findByAccountId = Effect.fn('TransactionRepository.findByAccountId')(function* (
        this: TransactionRepository,
        accountId: number
    ) {
        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                where: this.buildSingleAccountCondition(accountId),
                orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)]
            })
        );
    });

    readonly getTransactionTimeByAccountId = Effect.fn('TransactionRepository.getTransactionTimeByAccountId')(function* (
        this: TransactionRepository,
        accountId: number,
        mode: 'latest' | 'earliest'
    ) {
        const aggregateSql =
            mode === 'latest'
                ? sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`
                : sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`;

        return yield* this.selectOperatedAtTime(aggregateSql, this.buildSingleAccountCondition(accountId));
    });

    readonly getEarliestTransactionTimeByExternalSource = Effect.fn('TransactionRepository.getEarliestTransactionTimeByExternalSource')(
        function* (this: TransactionRepository, externalSource: ExternalSourceEnum) {
            return yield* this.selectOperatedAtTime(
                sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`,
                eq(TransactionEntityTable.externalSource, externalSource)
            );
        }
    );

    readonly archiveByAccountIds = Effect.fn('TransactionRepository.archiveByAccountIds')(function* (
        this: TransactionRepository,
        accountIds: number[]
    ) {
        const ledgerEntryCondition = this.buildLedgerEntryCondition();

        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ deletedAt: new Date() })
                .where(
                    and(
                        or(
                            inArray(TransactionEntityTable.toAccountId, accountIds),
                            inArray(TransactionEntityTable.fromAccountId, accountIds)
                        ),
                        or(
                            ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                            notExists(
                                db
                                    .select({ id: TransactionEntryEntityTable.id })
                                    .from(TransactionEntryEntityTable)
                                    .where(
                                        and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), ledgerEntryCondition)
                                    )
                            )
                        ),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                )
        );
    });

    readonly restoreByAccountIds = Effect.fn('TransactionRepository.restoreByAccountIds')(function* (accountIds: number[]) {
        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ deletedAt: null })
                .where(
                    or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds))
                )
        );
    });

    readonly findTransfersByAccountId = Effect.fn('TransactionRepository.findTransfersByAccountId')(function* (
        this: TransactionRepository,
        accountId: number,
        language: LanguageEnum
    ) {
        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                where: this.buildTransfersByAccountIdWhere(accountId),
                with: this.buildFullRelations(language)
            })
        );
    });

    readonly findTransfersForConversion = Effect.fn('TransactionRepository.findTransfersForConversion')(function* (
        this: TransactionRepository,
        accountId: number
    ) {
        return yield* Db.query(db =>
            db.query.TransactionEntityTable.findMany({
                where: this.buildTransfersByAccountIdWhere(accountId),
                with: {
                    [TransactionAssociationEnum.ENTRIES]: {
                        where: TransactionRepository.LIVE_ENTRY_RELATION_WHERE
                    }
                }
            })
        );
    });

    readonly deleteByAccountId = Effect.fn('TransactionRepository.deleteByAccountId')(function* (accountId: number) {
        yield* Db.query(db =>
            db
                .delete(TransactionEntityTable)
                .where(
                    and(
                        or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                        ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                    )
                )
        );
    });

    readonly convertTransfersFromAccountToIncome = Effect.fn('TransactionRepository.convertTransfersFromAccountToIncome')(function* (
        accountId: number
    ) {
        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ type: TransactionTypeEnum.INCOME, fromAccountId: sql`NULL`, exchangeRate: 1 })
                .where(
                    and(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), eq(TransactionEntityTable.fromAccountId, accountId))
                )
        );
    });

    readonly convertTransfersToAccountToExpense = Effect.fn('TransactionRepository.convertTransfersToAccountToExpense')(function* (
        accountId: number
    ) {
        yield* Db.query(db =>
            db
                .update(TransactionEntityTable)
                .set({ type: TransactionTypeEnum.EXPENSE, toAccountId: sql`NULL`, exchangeRate: 1 })
                .where(
                    and(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), eq(TransactionEntityTable.toAccountId, accountId))
                )
        );
    });

    readonly countAllActive = Effect.fn('TransactionRepository.countAllActive')(function* () {
        const [row] = yield* Db.query(db =>
            db.select({ value: count() }).from(TransactionEntityTable).where(isNull(TransactionEntityTable.deletedAt))
        );

        return row.value;
    });

    private readonly selectOperatedAtTime = Effect.fnUntraced(function* (aggregateSql: SQL<number | null>, condition: SQL | undefined) {
        const result = yield* Db.query(db =>
            db
                .select({ operatedAt: aggregateSql })
                .from(TransactionEntityTable)
                .where(and(condition, ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)))
        );

        const time = result[0]?.operatedAt;
        if (isPositiveNumber(time)) {
            return new Date(time * 1000);
        }

        return null;
    });

    private readonly findByIdsWithEntriesWhere = Effect.fnUntraced(function* (ids: number[], entriesWhere: SQL | undefined) {
        if (isNotEmptyArray(ids)) {
            return yield* Db.query(db =>
                db.query.TransactionEntityTable.findMany({
                    where: inArray(TransactionEntityTable.id, ids),
                    with: {
                        [TransactionAssociationEnum.ENTRIES]: {
                            where: entriesWhere
                        }
                    }
                })
            );
        }

        return [];
    });

    getAll(limit: number, filters: TransactionFilterInterface, language: LanguageEnum) {
        return this.listOrderedByOperatedAt(limit, language, this.buildWhere(filters));
    }

    countUncategorized(filters: TransactionFilterInterface) {
        return this.db
            .select({
                income: sql<number>`COALESCE(SUM(CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} THEN 1 ELSE 0 END), 0)`.mapWith(
                    Number
                ),
                expense:
                    sql<number>`COALESCE(SUM(CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.EXPENSE} THEN 1 ELSE 0 END), 0)`.mapWith(
                        Number
                    )
            })
            .from(TransactionEntityTable)
            .where(this.buildUncategorizedWhere(filters));
    }

    countAll(filters: TransactionFilterInterface) {
        return this.db.select({ value: count() }).from(TransactionEntityTable).where(this.buildWhere(filters));
    }

    getUncategorized(limit: number, filters: TransactionFilterInterface, language: LanguageEnum) {
        return this.listOrderedByOperatedAt(limit, language, this.buildUncategorizedWhere(filters));
    }

    getById(id: number, language: LanguageEnum) {
        return this.db.query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: this.buildFullRelations(language)
        });
    }

    private buildSingleAccountCondition(accountId: number) {
        return or(
            eq(TransactionEntityTable.fromAccountId, accountId),
            eq(TransactionEntityTable.toAccountId, accountId),
            inArray(TransactionEntityTable.id, this.buildTransactionIdsByEntryAccountIdsQuery([accountId])),
            inArray(TransactionEntityTable.id, this.buildTransactionIdsByDebtEventAccountIdsQuery([accountId]))
        );
    }

    private buildTransfersByAccountIdWhere(accountId: number) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
            or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId))
        );
    }

    private buildSimilarStatsSql(query: SimilarTransactionStatsQueryInterface): string {
        const conditions = [
            't.id != ?',
            't.type = ?',
            't.deleted_at IS NULL',
            't.consolidation_parent_transaction_id IS NULL',
            'te.deleted_at IS NULL',
            'te.original_transaction_id IS NULL',
            'te.account_id = ?',
            't.operated_at >= ?',
            't.operated_at < ?',
            ...this.buildSimilarIdentityConditions(query)
        ];

        return `
            SELECT
                strftime('%Y-%m', t.operated_at, 'unixepoch') AS monthKey,
                SUM(te.amount) AS totalAmount,
                COUNT(DISTINCT t.id) AS count,
                MAX(instrument.symbol) AS currencySymbol
            FROM transactions t
            INNER JOIN transaction_entries te ON te.transaction_id = t.id
            INNER JOIN accounts account ON account.id = te.account_id
            INNER JOIN instruments instrument ON instrument.id = account.instrument_id
            WHERE ${conditions.join(' AND ')}
            GROUP BY monthKey
            ORDER BY monthKey ASC
        `;
    }

    private buildSimilarStatsParams(query: SimilarTransactionStatsQueryInterface): (number | string)[] {
        const operatedAtSeconds = Math.floor(query.operatedAt.getTime() / 1000);
        const sinceSeconds = Math.floor(this.getSimilarStatsSinceDate(query).getTime() / 1000);
        const params: (number | string)[] = [query.transactionId, query.type, query.accountId, sinceSeconds, operatedAtSeconds];

        if (isNotEmptyString(query.title)) {
            params.push(query.title);
        } else if (isNotEmptyString(query.comment)) {
            params.push(query.comment);
        }

        if (isDefined(query.categoryId) && isPositiveNumber(query.categoryId)) {
            params.push(query.categoryId);
        }

        return params;
    }

    private buildSimilarIdentityConditions(query: SimilarTransactionStatsQueryInterface): string[] {
        const conditions: string[] = [];

        if (isNotEmptyString(query.title)) {
            conditions.push('LOWER(t.title) = LOWER(?)');
        } else if (isNotEmptyString(query.comment)) {
            conditions.push('LOWER(t.comment) = LOWER(?)');
        }

        if (isDefined(query.categoryId) && isPositiveNumber(query.categoryId)) {
            conditions.push('te.category_id = ?');
        }

        return conditions;
    }

    private getSimilarStatsSinceDate(query: SimilarTransactionStatsQueryInterface): Date {
        const since = new Date(query.operatedAt);
        since.setDate(1);
        since.setHours(0, 0, 0, 0);
        since.setMonth(since.getMonth() - query.months + 1);

        return since;
    }

    private buildWhere(filters: TransactionFilterInterface) {
        return and(this.buildFilterWhere(filters), ...(isNotEmptyArray(filters.types) ? [this.buildTypeCondition(filters.types)] : []));
    }

    private buildUncategorizedWhere(filters: TransactionFilterInterface) {
        return and(this.buildFilterWhere({ ...filters, categoryIds: [] }), this.buildCategorizableTypeCondition(filters.types));
    }

    private buildTypeCondition(types: TransactionTypeEnum[]) {
        return or(
            inArray(TransactionEntityTable.type, types),
            ...(types.includes(TransactionTypeEnum.EXPENSE) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.CREDIT)] : []),
            ...(types.includes(TransactionTypeEnum.INCOME) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.DEBIT)] : [])
        );
    }

    private buildAdjustmentCondition(type: TransactionEntryTypeEnum) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            inArray(
                TransactionEntityTable.id,
                this.db
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .where(and(eq(TransactionEntryEntityTable.type, type), this.buildLedgerEntryCondition()))
            )
        );
    }

    private listOrderedByOperatedAt(limit: number, language: LanguageEnum, where: SQL | null | undefined) {
        return this.db.query.TransactionEntityTable.findMany({
            with: this.buildFullRelations(language),
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt), desc(transaction.id)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    private buildFullRelations(language: LanguageEnum) {
        return {
            [TransactionAssociationEnum.ENTRIES]: {
                where: TransactionRepository.LIVE_ENTRY_RELATION_WHERE,
                with: {
                    [TransactionEntryAssociationEnum.ACCOUNT]: {
                        with: {
                            [AccountAssociationEnum.INSTRUMENT]: true
                        }
                    },
                    [TransactionEntryAssociationEnum.CATEGORY]: buildTranslatedCategoryRelation(language),
                    [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
                }
            },
            [TransactionAssociationEnum.TRANSACTION_TAGS]: {
                with: {
                    [TransactionTagsAssociationEnum.TAG]: true
                }
            },
            [TransactionAssociationEnum.DEBT_EVENTS]: {
                where: isNull(DebtEventEntityTable.deletedAt),
                with: {
                    [DebtEventAssociationEnum.DEBT_ACCOUNT]: {
                        with: {
                            [AccountAssociationEnum.INSTRUMENT]: true
                        }
                    }
                }
            },
            [TransactionAssociationEnum.FROM_ACCOUNT]: true,
            [TransactionAssociationEnum.TO_ACCOUNT]: true
        } as const;
    }
}
