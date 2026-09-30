import { and, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { insertTransactionTag } from '../../transaction-tags/util/insert-transaction-tag.util';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { DbError } from '../../@generic/error/db.error';
import type { TransactionTagsEntityInterface } from '../../transaction-tags/entity/transaction-tags-entity.interface';
import type { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionCategorizeInboxRepository extends BaseTransactionFilterRepository {
    private static readonly WRITE_CHUNK_SIZE = 500;

    readonly updateUncategorizedCategoryByTransactionIds = Effect.fn(
        'TransactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds'
    )(function* (
        this: TransactionCategorizeInboxRepository,
        transactionIds: number[],
        categoryId: number,
        categorySource: CategorySourceEnum
    ) {
        return yield* this.writeInChunks(transactionIds, chunk =>
            Db.query(db =>
                db
                    .update(TransactionEntryEntityTable)
                    .set({ categoryId, categorySource })
                    .where(and(this.buildAssignableEntryCondition(chunk), isNull(TransactionEntryEntityTable.categoryId)))
                    .returning({ transactionId: TransactionEntryEntityTable.transactionId })
            )
        );
    });

    readonly clearCategoryByTransactionIds = Effect.fn('TransactionCategorizeInboxRepository.clearCategoryByTransactionIds')(function* (
        this: TransactionCategorizeInboxRepository,
        transactionIds: number[],
        categoryId: number
    ) {
        return yield* this.writeInChunks(transactionIds, chunk =>
            Db.query(db =>
                db
                    .update(TransactionEntryEntityTable)
                    .set({ categoryId: null, categorySource: CategorySourceEnum.USER })
                    .where(and(this.buildAssignableEntryCondition(chunk), eq(TransactionEntryEntityTable.categoryId, categoryId)))
                    .returning({ transactionId: TransactionEntryEntityTable.transactionId })
            )
        );
    });

    readonly addTagByTransactionIds = Effect.fn('TransactionCategorizeInboxRepository.addTagByTransactionIds')(function* (
        this: TransactionCategorizeInboxRepository,
        transactionIds: number[],
        tagId: number
    ) {
        return yield* this.writeInChunks(transactionIds, chunk =>
            Db.query(db =>
                insertTransactionTag(
                    db,
                    tagId,
                    and(
                        inArray(TransactionEntityTable.id, chunk),
                        this.buildVisibleTransactionCondition(),
                        this.buildCategorizableTypeCondition(null)
                    )
                )
            )
        );
    });

    readonly removeTagByTransactionIds = Effect.fn('TransactionCategorizeInboxRepository.removeTagByTransactionIds')(function* (
        this: TransactionCategorizeInboxRepository,
        transactionIds: number[],
        tagId: number
    ) {
        return yield* this.writeInChunks(transactionIds, chunk =>
            Db.query(db =>
                db
                    .delete(TransactionTagsEntityTable)
                    .where(and(eq(TransactionTagsEntityTable.tagId, tagId), inArray(TransactionTagsEntityTable.transactionId, chunk)))
                    .returning({ transactionId: TransactionTagsEntityTable.transactionId })
            )
        );
    });

    private readonly writeInChunks = Effect.fnUntraced(function* (
        transactionIds: number[],
        writeChunk: (chunk: number[]) => Effect.Effect<Pick<TransactionTagsEntityInterface, 'transactionId'>[], DbError, Db>
    ) {
        const { WRITE_CHUNK_SIZE } = TransactionCategorizeInboxRepository;
        const writtenTransactionIds = new Set<number>();

        for (let start = 0; start < transactionIds.length; start += WRITE_CHUNK_SIZE) {
            const rows = yield* writeChunk(transactionIds.slice(start, start + WRITE_CHUNK_SIZE));

            for (const row of rows) {
                writtenTransactionIds.add(row.transactionId);
            }
        }

        return [...writtenTransactionIds];
    });

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
                operatedAt: TransactionEntityTable.operatedAt,
                amount: TransactionEntryEntityTable.amount,
                baseAmount: TransactionEntryEntityTable.baseAmount,
                baseInstrumentId: TransactionEntryEntityTable.baseInstrumentId,
                mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                mcc: MccCategoryEntityTable.mcc,
                instrumentSymbol: InstrumentEntityTable.symbol
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
