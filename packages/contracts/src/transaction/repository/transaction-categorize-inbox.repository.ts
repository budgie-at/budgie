import { Log } from '@budgie/logger';
import { and, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { CategorySourceEnum } from '../../transaction-entry/enum/category-source.enum';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionFilterInterface } from '../interface/transaction-filter.interface';

export class TransactionCategorizeInboxRepository extends BaseTransactionFilterRepository {
    private static readonly UPDATE_CHUNK_SIZE = 500;

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
        if (isEmptyArray(transactionIds)) {
            return [];
        }

        const runner = tx ?? this.db;
        const chunks = this.chunkTransactionIds(transactionIds);

        const updatedTransactionIds = await chunks.reduce<Promise<Set<number>>>(async (previousUpdatedIdsPromise, chunk) => {
            const previousUpdatedIds = await previousUpdatedIdsPromise;
            const rows = await runner
                .update(TransactionEntryEntityTable)
                .set({ categoryId, categorySource })
                .where(and(this.buildAssignableEntryCondition(chunk), isNull(TransactionEntryEntityTable.categoryId)))
                .returning({ transactionId: TransactionEntryEntityTable.transactionId });

            for (const row of rows) {
                previousUpdatedIds.add(row.transactionId);
            }

            return previousUpdatedIds;
        }, Promise.resolve(new Set<number>()));

        return [...updatedTransactionIds];
    }

    @Log(
        (transactionIds, categoryId, tx) =>
            `enter transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (...[, transactionIds, categoryId, tx]) =>
            `done transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, categoryId, tx) =>
            `throw transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async clearCategoryByTransactionIds(transactionIds: number[], categoryId: number, tx?: DB): Promise<void> {
        if (isEmptyArray(transactionIds)) {
            return;
        }

        const runner = tx ?? this.db;
        const chunks = this.chunkTransactionIds(transactionIds);

        await chunks.reduce<Promise<void>>(async (previousChunkPromise, chunk) => {
            await previousChunkPromise;
            await runner
                .update(TransactionEntryEntityTable)
                .set({ categoryId: null, categorySource: CategorySourceEnum.USER })
                .where(and(this.buildAssignableEntryCondition(chunk), eq(TransactionEntryEntityTable.categoryId, categoryId)));
        }, Promise.resolve());
    }

    findUncategorizedRows(filters: TransactionFilterInterface) {
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
            .where(this.buildUncategorizedRowsWhere(filters))
            .orderBy(desc(TransactionEntityTable.operatedAt));
    }

    findLabeledEvidence() {
        return this.db
            .select({
                title: TransactionEntityTable.title,
                type: TransactionEntityTable.type,
                mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                categoryId: sql<number>`${TransactionEntryEntityTable.categoryId}`.mapWith(Number),
                count: sql<number>`COUNT(*)`
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
            .innerJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .where(this.buildLabeledEvidenceWhere())
            .groupBy(
                TransactionEntityTable.title,
                TransactionEntityTable.type,
                TransactionEntryEntityTable.mccCategoryId,
                TransactionEntryEntityTable.categoryId
            );
    }

    protected override buildAccountCondition(accountIds: number[] | null) {
        return this.buildEntryAccountCondition(accountIds);
    }

    private chunkTransactionIds(transactionIds: number[]): number[][] {
        const { UPDATE_CHUNK_SIZE } = TransactionCategorizeInboxRepository;
        const chunks: number[][] = [];

        for (let start = 0; start < transactionIds.length; start += UPDATE_CHUNK_SIZE) {
            chunks.push(transactionIds.slice(start, start + UPDATE_CHUNK_SIZE));
        }

        return chunks;
    }

    private buildAssignableEntryCondition(transactionIds: number[]) {
        return and(inArray(TransactionEntryEntityTable.transactionId, transactionIds), ...this.buildAssignableEntryConditions());
    }

    private buildAssignableEntryConditions() {
        return [
            isNull(TransactionEntryEntityTable.deletedAt),
            isNull(TransactionEntryEntityTable.originalTransactionId),
            eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY),
            ne(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE)
        ];
    }

    private buildUncategorizedRowsWhere(filters: TransactionFilterInterface) {
        const uncategorizedTypes = [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE].filter(
            type => !isNotEmptyArray(filters.types) || filters.types.includes(type)
        );
        const conditions = [
            isNull(TransactionEntryEntityTable.categoryId),
            ...this.buildAssignableEntryConditions(),
            inArray(TransactionEntityTable.type, uncategorizedTypes),
            this.buildVisibleTransactionCondition(),
            ...this.buildAccountCondition(filters.accountIds),
            ...(isDefined(filters.tagIds) ? [this.buildTagCondition(filters.tagIds)] : []),
            ...(isDefined(filters.date) ? [this.buildDateCondition(filters.date)] : []),
            ...(isDefined(filters.amount) ? [this.buildAmountCondition(filters.amount)] : [])
        ].filter(isDefined);

        return and(...conditions);
    }

    private buildLabeledEvidenceWhere() {
        return and(
            isNotNull(TransactionEntryEntityTable.categoryId),
            ...this.buildAssignableEntryConditions(),
            ne(TransactionEntryEntityTable.categorySource, CategorySourceEnum.MCC_DEFAULT),
            this.buildVisibleTransactionCondition(),
            inArray(TransactionEntityTable.type, [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]),
            eq(CategoryEntityTable.isSystemCategory, false),
            isNull(CategoryEntityTable.deletedAt)
        );
    }
}
