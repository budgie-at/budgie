import { Log } from '@budgie/logger';
import { and, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { insertTransactionTag } from '../../transaction-tags/util/insert-transaction-tag.util';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionTagsEntityInterface } from '../../transaction-tags/entity/transaction-tags-entity.interface';
import type { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionCategorizeInboxRepository extends BaseTransactionFilterRepository {
    private static readonly WRITE_CHUNK_SIZE = 500;

    @Log(
        (transactionIds, categoryId, categorySource, tx) =>
            `enter transactionCount=${transactionIds.length} categoryId=${categoryId} categorySource=${categorySource} inTx=${String(isDefined(tx))}`,
        (result, ...[transactionIds, categoryId, categorySource, tx]) =>
            `done updatedCount=${result.length} transactionCount=${transactionIds.length} categoryId=${categoryId} categorySource=${categorySource} inTx=${String(isDefined(tx))}`,
        (error, ...[transactionIds, categoryId, categorySource, tx]) =>
            `throw transactionCount=${transactionIds.length} categoryId=${categoryId} categorySource=${categorySource} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateUncategorizedCategoryByTransactionIds(
        transactionIds: number[],
        categoryId: number,
        categorySource: CategorySourceEnum,
        tx?: DB
    ): Promise<number[]> {
        const runner = tx ?? this.db;

        return this.writeInChunks(transactionIds, chunk =>
            runner
                .update(TransactionEntryEntityTable)
                .set({ categoryId, categorySource })
                .where(and(this.buildAssignableEntryCondition(chunk), isNull(TransactionEntryEntityTable.categoryId)))
                .returning({ transactionId: TransactionEntryEntityTable.transactionId })
        );
    }

    @Log(
        (transactionIds, categoryId, tx) =>
            `enter transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (result, transactionIds, categoryId, tx) =>
            `done clearedCount=${result.length} transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, categoryId, tx) =>
            `throw transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async clearCategoryByTransactionIds(transactionIds: number[], categoryId: number, tx?: DB): Promise<number[]> {
        const runner = tx ?? this.db;

        return this.writeInChunks(transactionIds, chunk =>
            runner
                .update(TransactionEntryEntityTable)
                .set({ categoryId: null, categorySource: CategorySourceEnum.USER })
                .where(and(this.buildAssignableEntryCondition(chunk), eq(TransactionEntryEntityTable.categoryId, categoryId)))
                .returning({ transactionId: TransactionEntryEntityTable.transactionId })
        );
    }

    @Log(
        (transactionIds, tagId, tx) => `enter transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))}`,
        (result, transactionIds, tagId, tx) =>
            `done insertedCount=${result.length} transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, tagId, tx) =>
            `throw transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async addTagByTransactionIds(transactionIds: number[], tagId: number, tx?: DB): Promise<number[]> {
        const runner = tx ?? this.db;

        return this.writeInChunks(transactionIds, chunk =>
            insertTransactionTag(
                runner,
                tagId,
                and(
                    inArray(TransactionEntityTable.id, chunk),
                    this.buildVisibleTransactionCondition(),
                    this.buildCategorizableTypeCondition(null)
                )
            )
        );
    }

    @Log(
        (transactionIds, tagId, tx) => `enter transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))}`,
        (result, transactionIds, tagId, tx) =>
            `done removedCount=${result.length} transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, tagId, tx) =>
            `throw transactionCount=${transactionIds.length} tagId=${tagId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async removeTagByTransactionIds(transactionIds: number[], tagId: number, tx?: DB): Promise<number[]> {
        const runner = tx ?? this.db;

        return this.writeInChunks(transactionIds, chunk =>
            runner
                .delete(TransactionTagsEntityTable)
                .where(and(eq(TransactionTagsEntityTable.tagId, tagId), inArray(TransactionTagsEntityTable.transactionId, chunk)))
                .returning({ transactionId: TransactionTagsEntityTable.transactionId })
        );
    }

    findUncategorizedRows(filters: TransactionFilterInterface) {
        return this.selectInboxRows(this.buildInboxRowsWhere({ ...filters, categoryIds: null }, this.buildUncategorizedEntryCondition()));
    }

    findUntaggedRows(filters: TransactionFilterInterface) {
        return this.selectInboxRows(
            this.buildInboxRowsWhere(
                { ...filters, tagIds: [] },
                and(this.buildCategorizableEntryCondition(), this.buildNonDebtAccountCondition())
            )
        );
    }

    findCategoryEvidence() {
        return this.selectEvidence(sql<number>`${TransactionEntryEntityTable.categoryId}`.mapWith(Number))
            .innerJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .where(
                this.buildEvidenceWhere([
                    isNotNull(TransactionEntryEntityTable.categoryId),
                    ne(TransactionEntryEntityTable.categorySource, CategorySourceEnum.MCC_DEFAULT),
                    eq(CategoryEntityTable.isSystemCategory, false),
                    isNull(CategoryEntityTable.deletedAt)
                ])
            )
            .groupBy(...this.buildEvidenceGroupBy(), TransactionEntryEntityTable.categoryId);
    }

    findTagEvidence() {
        return this.selectEvidence(sql<number>`${TransactionTagsEntityTable.tagId}`.mapWith(Number))
            .innerJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .where(this.buildEvidenceWhere([]))
            .groupBy(...this.buildEvidenceGroupBy(), TransactionTagsEntityTable.tagId);
    }

    private selectInboxRows(where: SQL | undefined) {
        return this.db
            .select({
                transactionId: TransactionEntityTable.id,
                type: TransactionEntityTable.type,
                title: TransactionEntityTable.title,
                comment: TransactionEntityTable.comment,
                operatedAt: TransactionEntityTable.operatedAt,
                accountId: TransactionEntryEntityTable.accountId,
                amount: TransactionEntryEntityTable.amount,
                baseAmount: TransactionEntryEntityTable.baseAmount,
                baseInstrumentId: TransactionEntryEntityTable.baseInstrumentId,
                toIban: TransactionEntryEntityTable.toIban,
                mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                instrumentId: AccountEntityTable.instrumentId,
                instrumentSymbol: InstrumentEntityTable.symbol,
                mccCode: MccCategoryEntityTable.mcc,
                mccDescription: MccCategoryEntityTable.fullDescription
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
            .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .where(where)
            .orderBy(desc(TransactionEntityTable.operatedAt));
    }

    private selectEvidence(labelId: SQL<number>) {
        return this.db
            .select({
                title: TransactionEntityTable.title,
                type: TransactionEntityTable.type,
                mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                labelId,
                count: sql<number>`COUNT(*)`
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId));
    }

    private buildEvidenceGroupBy() {
        return [TransactionEntityTable.title, TransactionEntityTable.type, TransactionEntryEntityTable.mccCategoryId];
    }

    private async writeInChunks(
        transactionIds: number[],
        writeChunk: (chunk: number[]) => Promise<Pick<TransactionTagsEntityInterface, 'transactionId'>[]>
    ): Promise<number[]> {
        if (isEmptyArray(transactionIds)) {
            return [];
        }

        const { WRITE_CHUNK_SIZE } = TransactionCategorizeInboxRepository;
        const chunks: number[][] = [];

        for (let start = 0; start < transactionIds.length; start += WRITE_CHUNK_SIZE) {
            chunks.push(transactionIds.slice(start, start + WRITE_CHUNK_SIZE));
        }

        const writtenTransactionIds = await chunks.reduce<Promise<Set<number>>>(async (previousWrittenIdsPromise, chunk) => {
            const previousWrittenIds = await previousWrittenIdsPromise;
            const rows = await writeChunk(chunk);

            for (const row of rows) {
                previousWrittenIds.add(row.transactionId);
            }

            return previousWrittenIds;
        }, Promise.resolve(new Set<number>()));

        return [...writtenTransactionIds];
    }

    private buildAssignableEntryCondition(transactionIds: number[]) {
        return and(inArray(TransactionEntryEntityTable.transactionId, transactionIds), this.buildCategorizableEntryCondition());
    }

    private buildInboxRowsWhere(filters: TransactionFilterInterface, entryCondition: SQL | undefined) {
        return and(this.buildFilterWhere(filters), this.buildCategorizableTypeCondition(filters.types), entryCondition);
    }

    private buildEvidenceWhere(labelConditions: SQL[]) {
        return and(
            ...labelConditions,
            this.buildCategorizableEntryCondition(),
            this.buildVisibleTransactionCondition(),
            this.buildCategorizableTypeCondition(null)
        );
    }
}
