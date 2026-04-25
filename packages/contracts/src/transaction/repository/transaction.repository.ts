/* eslint-disable max-lines -- Transaction repository is the kitchen sink for tx queries + filter builders + bank-sync helpers */
import { SQL, and, count, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Log } from '../../@generic/util/logger/console-transport.util';
import { getLogger } from '../../@generic/util/logger/get-logger.util';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { DEFAULT_TRANSACTION_FILTER } from '../constant/default-transaction-filter.constant';
import { TRANSACTION_FULL_RELATIONS } from '../constant/transaction-relations.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { deriveEmbeddingFlag } from '../util/derive-embedding-flag.util';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';
import type { TransactionWithEntriesEntityInterface } from '../entity/transaction-with-entries-entity.interface';

const logger = getLogger('TransactionRepository');

export class TransactionRepository extends BaseTransactionFilterRepository {
    private transactionRelations = TRANSACTION_FULL_RELATIONS;

    @Log('repo:transaction:bulkCreate')
    async bulkCreate(inputs: TransactionCreateEntityInterface[], tx?: DB): Promise<TransactionEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            logger.log('repo:transaction:bulkCreate', {
                count: inputs.length,
                externalSources: inputs.map(input => input.externalSource),
                externalIds: inputs.map(input => input.externalId)
            });
            const results = await (tx ?? this.db).insert(TransactionEntityTable).values(inputs).returning();
            logger.log('repo:transaction:bulkCreate:done', {
                requested: inputs.length,
                inserted: results.length,
                insertedIds: results.map(row => row.id)
            });

            return results;
        }

        return [];
    }

    async create(input: TransactionCreateEntityInterface, tx?: DB): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input], tx);

        return transaction;
    }

    async deleteById(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id));
    }

    async updateById(id: number, input: Partial<TransactionCreateEntityInterface>, tx?: DB): Promise<TransactionEntityInterface> {
        const finalInput = { ...input, ...deriveEmbeddingFlag(input) };
        const [transaction] = await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set(finalInput)
            .where(eq(TransactionEntityTable.id, id))
            .returning();

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
        const baseFilter = isNull(TransactionEntityTable.deletedAt);
        const where = isDefined(cursorId) ? and(baseFilter, lt(TransactionEntityTable.id, cursorId)) : baseFilter;

        return this.db.query.TransactionEntityTable.findMany({
            with: { [TransactionAssociationEnum.ENTRIES]: true },
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

    async clearAlreadyIndexedMerchantFlags(tx?: DB): Promise<void> {
        const start = Date.now();
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
        logger.log('repo:transaction:clearAlreadyIndexedMerchantFlags:done', { durationMs: Date.now() - start });
    }

    async clearAlreadyIndexedCommentFlags(tx?: DB): Promise<void> {
        const start = Date.now();
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
        logger.log('repo:transaction:clearAlreadyIndexedCommentFlags:done', { durationMs: Date.now() - start });
    }

    async findMccCategorySuggestions(mccCategoryId: number, limit: number): Promise<{ categoryId: number; count: number }[]> {
        const start = Date.now();
        const rows = await this.db.$client.getAllAsync<{ categoryId: number; count: number }>(
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

        logger.log('repo:transaction:findMccCategorySuggestions:done', {
            mccCategoryId,
            resultCount: rows.length,
            durationMs: Date.now() - start,
            topCategoryIds: rows.slice(0, 3).map(row => row.categoryId)
        });

        return rows;
    }

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

        const ids = results.map(row => row.externalId).filter(isDefined);
        logger.log('repo:transaction:findExternalIdsByExternalSource', { externalSource, count: ids.length });

        return ids;
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
            ...this.buildAccountCondition(accountIds),
            ...(isNotEmptyArray(types) ? [this.buildTypeCondition(types)] : []),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isNotEmptyArray(tagIds) ? [this.buildTagCondition(tagIds)] : []),
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
                    .where(eq(TransactionEntryEntityTable.type, type))
            )
        );
    }
}
