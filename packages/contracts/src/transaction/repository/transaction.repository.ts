/* eslint-disable max-lines -- Transaction repository is the kitchen sink for tx queries + filter builders + bank-sync helpers */
import { Log } from '@budgie/logger';
import { SQL, and, count, eq, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { DEFAULT_TRANSACTION_FILTER } from '../constant/default-transaction-filter.constant';
import { TRANSACTION_FULL_RELATIONS } from '../constant/transaction-relations.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { deriveEmbeddingFlag } from '../util/derive-embedding-flag.util';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';
import type { TransactionWithEntriesEntityInterface } from '../entity/transaction-with-entries-entity.interface';
import type { TransactionUpdateInputInterface } from '../input/transaction-update-input.interface';
import type { ConsolidationSourceRowInterface } from '../interface/consolidation-source-row.interface';

export class TransactionRepository extends BaseTransactionFilterRepository {
    private transactionRelations = TRANSACTION_FULL_RELATIONS;

    @Log(
        (inputs, tx) => `enter hasTx=${String(isDefined(tx))} externalIds=${inputs.map(input => input.externalId).join(',')}`,
        (result, inputs, tx) =>
            `done hasTx=${String(isDefined(tx))} externalIds=${inputs.map(input => input.externalId).join(',')} insertedIds=${result.map(row => row.id).join(',')}`,
        (error, inputs, tx) =>
            `throw hasTx=${String(isDefined(tx))} externalIds=${inputs.map(input => input.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    async bulkCreate(inputs: TransactionCreateEntityInterface[], tx?: DB): Promise<TransactionEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionEntityTable).values(inputs).returning();
        }

        return [];
    }

    @Log(
        tx => `enter hasTx=${String(isDefined(tx))}`,
        'done',
        (error, tx) => `throw hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async clearAlreadyIndexedMerchantFlags(tx?: DB): Promise<void> {
        (tx ?? this.db).run(sql`
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
        `);
    }

    @Log(
        tx => `enter hasTx=${String(isDefined(tx))}`,
        'done',
        (error, tx) => `throw hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async clearAlreadyIndexedCommentFlags(tx?: DB): Promise<void> {
        (tx ?? this.db).run(sql`
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
        `);
    }

    @Log(
        (mccCategoryId, limit) => `enter mccCategoryId=${mccCategoryId} limit=${limit}`,
        (result, mccCategoryId, limit) =>
            `done mccCategoryId=${mccCategoryId} limit=${limit} categoryIds=${result.map(row => row.categoryId).join(',')}`,
        (error, mccCategoryId, limit) => `throw mccCategoryId=${mccCategoryId} limit=${limit} error=${getErrorMessage(error)}`
    )
    async findMccCategorySuggestions(mccCategoryId: number, limit: number): Promise<{ categoryId: number; count: number }[]> {
        return await this.db.$client.getAllAsync<{ categoryId: number; count: number }>(
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
        );
    }

    @Log(
        externalSource => `enter externalSource=${externalSource}`,
        (result, externalSource) => `done externalSource=${externalSource} externalIds=${result.join(',')}`,
        (error, externalSource) => `throw externalSource=${externalSource} error=${getErrorMessage(error)}`
    )
    async findExternalIdsByExternalSource(externalSource: ExternalSourceEnum): Promise<string[]> {
        const results = await this.db
            .select({ externalId: TransactionEntityTable.externalId })
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, externalSource),
                    isNotNull(TransactionEntityTable.externalId),
                    isNull(TransactionEntityTable.deletedAt)
                )
            );

        return results.map(row => row.externalId).filter(isDefined);
    }

    @Log(
        canonicalTransactionId => `enter canonicalTransactionId=${canonicalTransactionId}`,
        (result, canonicalTransactionId) =>
            `done canonicalTransactionId=${canonicalTransactionId} sourceTransactionIds=${result.map(row => row.sourceTransactionId).join(',')}`,
        (error, canonicalTransactionId) => `throw canonicalTransactionId=${canonicalTransactionId} error=${getErrorMessage(error)}`
    )
    async findConsolidationSources(canonicalTransactionId: number): Promise<ConsolidationSourceRowInterface[]> {
        return await this.db.$client.getAllAsync<ConsolidationSourceRowInterface>(
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
                category.title AS categoryTitle,
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
            [canonicalTransactionId]
        );
    }

    @Log(
        (accountIds, tx) => `enter accountIds=${accountIds.join(',')} hasTx=${String(isDefined(tx))}`,
        (result, accountIds, tx) =>
            `done accountIds=${accountIds.join(',')} hasTx=${String(isDefined(tx))} canonicalIds=${result.map(row => row.id).join(',')}`,
        (error, accountIds, tx) => `throw accountIds=${accountIds.join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async findActiveAutoConsolidatedByAccountIds(accountIds: number[], tx?: DB): Promise<{ id: number }[]> {
        if (isEmptyArray(accountIds)) {
            return [];
        }

        const runner = tx ?? this.db;
        const movedSourceCanonicalIds = runner
            .select({ transactionId: TransactionEntryEntityTable.transactionId })
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            );

        return await runner
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
            );
    }

    @Log(
        (accountIds, since, tx) => `enter accountIds=${accountIds.join(',')} since=${since.toISOString()} hasTx=${String(isDefined(tx))}`,
        (result, accountIds, since, tx) =>
            `done accountIds=${accountIds.join(',')} since=${since.toISOString()} hasTx=${String(isDefined(tx))} canonicalIds=${result.map(row => row.id).join(',')}`,
        (error, accountIds, since, tx) =>
            `throw accountIds=${accountIds.join(',')} since=${since.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async findActiveAutoConsolidatedByAccountIdsSince(accountIds: number[], since: Date, tx?: DB): Promise<{ id: number }[]> {
        if (isEmptyArray(accountIds)) {
            return [];
        }
        const runner = tx ?? this.db;
        const sourceTransaction = alias(TransactionEntityTable, 'source_tx');

        return await runner
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
            );
    }

    @Log(
        (sourceTransactionIds, canonicalTransactionId, tx) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        'done',
        (error, sourceTransactionIds, canonicalTransactionId, tx) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async setConsolidationParent(sourceTransactionIds: number[], canonicalTransactionId: number, tx?: DB): Promise<void> {
        if (isEmptyArray(sourceTransactionIds)) {
            return;
        }

        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonicalTransactionId })
            .where(
                and(
                    inArray(TransactionEntityTable.id, sourceTransactionIds),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(TransactionEntityTable.consolidationParentTransactionId)
                )
            );
    }

    @Log(
        (transactionId, type, tx) => `enter transactionId=${transactionId} type=${type ?? 'null'} hasTx=${String(isDefined(tx))}`,
        'done',
        (error, transactionId, type, tx) =>
            `throw transactionId=${transactionId} type=${type ?? 'null'} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async setConsolidationType(transactionId: number, type: TransactionConsolidationTypeEnum | null, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ consolidationType: type })
            .where(eq(TransactionEntityTable.id, transactionId));
    }

    @Log(
        (canonicalTransactionId, tx) => `enter canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        'done',
        (error, canonicalTransactionId, tx) =>
            `throw canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async clearConsolidationParent(canonicalTransactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: null })
            .where(eq(TransactionEntityTable.consolidationParentTransactionId, canonicalTransactionId));
    }

    async create(input: TransactionCreateEntityInterface, tx?: DB): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input], tx);

        return transaction;
    }

    async deleteById(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id));
    }

    async updateById(id: number, input: TransactionUpdateInputInterface, tx?: DB): Promise<TransactionEntityInterface> {
        const finalInput = { ...input, ...deriveEmbeddingFlag(input) };
        const [transaction] = await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set(finalInput)
            .where(eq(TransactionEntityTable.id, id))
            .returning();

        if (!isDefined(transaction)) {
            throw new Error(`Transaction ${id} not found`);
        }

        return transaction;
    }

    getAll(limit = 20, filters: TransactionFilterInterface = DEFAULT_TRANSACTION_FILTER) {
        const where = this.buildWhere(filters);

        return this.db.query.TransactionEntityTable.findMany({
            with: this.transactionRelations,
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt), desc(transaction.id)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    getAllAfter(cursorId: number | null, limit: number) {
        const baseFilter = and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId));
        const where = isDefined(cursorId) ? and(baseFilter, lt(TransactionEntityTable.id, cursorId)) : baseFilter;

        return this.db.query.TransactionEntityTable.findMany({
            with: {
                [TransactionAssociationEnum.ENTRIES]: {
                    where: isNull(TransactionEntryEntityTable.originalTransactionId)
                }
            },
            orderBy: (transaction, { desc }) => [desc(transaction.id)],
            limit,
            where
        });
    }

    getById(id: number, tx?: DB) {
        return (tx ?? this.db).query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: this.transactionRelations
        });
    }

    async findByIds(ids: number[], tx?: DB): Promise<TransactionWithEntriesEntityInterface[]> {
        if (isNotEmptyArray(ids)) {
            return await (tx ?? this.db).query.TransactionEntityTable.findMany({
                where: inArray(TransactionEntityTable.id, ids),
                with: { [TransactionAssociationEnum.ENTRIES]: true }
            });
        }

        return [];
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable);
    }

    async markAllForEmbedding(tx?: DB): Promise<void> {
        await (tx ?? this.db).update(TransactionEntityTable).set({ needsEmbedding: true }).where(isNull(TransactionEntityTable.deletedAt));
    }

    async clearNeedsEmbedding(ids: number[], tx?: DB): Promise<void> {
        if (isEmptyArray(ids)) {
            return;
        }
        const CHUNK = 500;
        const runner = tx ?? this.db;
        for (let start = 0; start < ids.length; start += CHUNK) {
            const chunk = ids.slice(start, start + CHUNK);
            // eslint-disable-next-line no-await-in-loop -- sequential chunking to stay under SQLITE_MAX_VARIABLE_NUMBER
            await runner
                .update(TransactionEntityTable)
                .set({ needsEmbedding: false })
                .where(and(eq(TransactionEntityTable.needsEmbedding, true), inArray(TransactionEntityTable.id, chunk)));
        }
    }

    async clearNonIndexableFlags(tx?: DB): Promise<void> {
        const runner = tx ?? this.db;

        runner.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title = ''
              AND comment = ''
        `);

        runner.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NULL
              )
        `);

        runner.run(sql`
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
        `);

        runner.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND type IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.ADJUSTMENT})
        `);
    }

    async findIdMapByExternalSource(externalSource: ExternalSourceEnum): Promise<Map<string, number>> {
        const results = await this.db
            .select({ id: TransactionEntityTable.id, externalId: TransactionEntityTable.externalId })
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, externalSource),
                    isNotNull(TransactionEntityTable.externalId),
                    isNull(TransactionEntityTable.deletedAt)
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
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return await this.db.query.TransactionEntityTable.findMany({
            where: or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)]
        });
    }

    async getTransactionTimeByAccountId(accountId: number, mode: 'latest' | 'earliest'): Promise<Date | null> {
        const aggregateSql =
            mode === 'latest'
                ? sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`
                : sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`;

        const result = await this.db
            .select({ operatedAt: aggregateSql })
            .from(TransactionEntityTable)
            .where(
                and(
                    or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)
                )
            );

        const time = result[0]?.operatedAt;
        if (isPositiveNumber(time)) {
            return new Date(time * 1000);
        }

        return null;
    }

    async archiveByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async restoreByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: null })
            .where(or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)));
    }

    async findTransfersByAccountId(accountId: number, tx?: DB): Promise<TransactionWithEntriesEntityInterface[]> {
        return await (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: this.buildTransfersByAccountIdWhere(accountId),
            with: this.transactionRelations
        });
    }

    async findTransfersForConversion(accountId: number, tx?: DB): Promise<TransactionWithEntriesEntityInterface[]> {
        return await (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: this.buildTransfersByAccountIdWhere(accountId),
            with: { [TransactionAssociationEnum.ENTRIES]: true }
        });
    }

    async deleteByAccountId(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .delete(TransactionEntityTable)
            .where(
                and(
                    or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async convertTransfersFromAccountToIncome(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ type: TransactionTypeEnum.INCOME, fromAccountId: sql`NULL`, exchangeRate: 1 })
            .where(and(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), eq(TransactionEntityTable.fromAccountId, accountId)));
    }

    async convertTransfersToAccountToExpense(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ type: TransactionTypeEnum.EXPENSE, toAccountId: sql`NULL`, exchangeRate: 1 })
            .where(and(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), eq(TransactionEntityTable.toAccountId, accountId)));
    }

    async countAllActive(): Promise<number> {
        const [row] = await this.db.select({ value: count() }).from(TransactionEntityTable).where(isNull(TransactionEntityTable.deletedAt));

        return row.value;
    }

    protected override buildAccountCondition(accountIds: number[] | null) {
        if (isNotEmptyArray(accountIds)) {
            const condition = or(
                inArray(TransactionEntityTable.fromAccountId, accountIds),
                inArray(TransactionEntityTable.toAccountId, accountIds)
            );

            return isDefined(condition) ? [condition] : [];
        }

        return [];
    }

    private buildTransfersByAccountIdWhere(accountId: number) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
            or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId))
        );
    }

    private buildWhere({ types, tagIds, categoryIds, accountIds, date }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            this.buildVisibleTransactionCondition(),
            ...this.buildAccountCondition(accountIds),
            ...(isNotEmptyArray(types) ? [this.buildTypeCondition(types)] : []),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isDefined(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(conditions) ? and(...conditions) : null;
    }

    private buildTypeCondition(types: TransactionTypeEnum[]) {
        const typeConditions = [
            inArray(TransactionEntityTable.type, types),
            ...(types.includes(TransactionTypeEnum.EXPENSE) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.CREDIT)] : []),
            ...(types.includes(TransactionTypeEnum.INCOME) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.DEBIT)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(typeConditions) ? or(...typeConditions) : null;
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
}
