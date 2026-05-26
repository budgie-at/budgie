import { Log } from '@budgie/logger';
import { and, count, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';
import type { CategorySourceEnum } from '../enum/category-source.enum';
import type { TransactionEntryUpdateInputInterface } from '../input/transaction-entry-update-input.interface';
import type { BaseValuationBucketUpdateInterface } from '../interface/base-valuation-bucket-update.interface';
import type { PendingBaseValuationBucketInterface } from '../interface/pending-base-valuation-bucket.interface';

export class TransactionEntryRepository {
    constructor(private db: DB) {}

    @Log(
        (sourceIds, canonicalId, tx) => `enter sourceIds=${sourceIds.join(',')} canonicalId=${canonicalId} inTx=${String(isDefined(tx))}`,
        'done',
        (error, sourceIds, canonicalId, tx) =>
            `throw sourceIds=${sourceIds.join(',')} canonicalId=${canonicalId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async moveToConsolidatedTransaction(sourceTransactionIds: number[], canonicalTransactionId: number, tx?: DB): Promise<void> {
        if (!isNotEmptyArray(sourceTransactionIds)) {
            return;
        }

        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({
                originalTransactionId: TransactionEntryEntityTable.transactionId,
                transactionId: canonicalTransactionId
            })
            .where(
                and(
                    inArray(TransactionEntryEntityTable.transactionId, sourceTransactionIds),
                    isNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            );
    }

    @Log(
        (canonicalId, tx) => `enter canonicalId=${canonicalId} inTx=${String(isDefined(tx))}`,
        'done',
        (error, canonicalId, tx) => `throw canonicalId=${canonicalId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async moveBackToOriginalTransactions(canonicalTransactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({
                transactionId: TransactionEntryEntityTable.originalTransactionId,
                originalTransactionId: null
            })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, canonicalTransactionId),
                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            );
    }

    @Log(
        (transactionIds, tx) => `enter transactionIds=${transactionIds.join(',')} inTx=${String(isDefined(tx))}`,
        (result, transactionIds, tx) =>
            `done result=${String(result)} transactionIds=${transactionIds.join(',')} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, tx) =>
            `throw transactionIds=${transactionIds.join(',')} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async hasMovedSourceEntries(transactionIds: number[], tx?: DB): Promise<boolean> {
        if (!isNotEmptyArray(transactionIds)) {
            return false;
        }

        const [entry] = await (tx ?? this.db)
            .select({ id: TransactionEntryEntityTable.id })
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            )
            .limit(1);

        return isDefined(entry);
    }

    async bulkCreate(inputs: TransactionEntryCreateEntityInterface[], tx?: DB): Promise<TransactionEntryEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionEntryEntityTable).values(inputs).returning();
        }

        return [];
    }

    async create(input: TransactionEntryCreateEntityInterface, tx?: DB): Promise<TransactionEntryEntityInterface> {
        const [transactionEntry] = await (tx ?? this.db).insert(TransactionEntryEntityTable).values([input]).returning();

        return transactionEntry;
    }

    async findPendingBaseValuationBuckets(baseInstrumentId: number, tx?: DB): Promise<PendingBaseValuationBucketInterface[]> {
        const originalTransaction = alias(TransactionEntityTable, 'original_transaction');
        const rateDateSql = sql<string>`date(COALESCE(${originalTransaction.operatedAt}, ${TransactionEntityTable.operatedAt}), 'unixepoch')`;

        return await (tx ?? this.db)
            .select({
                rateDate: rateDateSql,
                sourceInstrumentId: AccountEntityTable.instrumentId,
                entryCount: count(TransactionEntryEntityTable.id)
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(originalTransaction, eq(originalTransaction.id, TransactionEntryEntityTable.originalTransactionId))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    this.buildPendingBaseValuationWhere(baseInstrumentId),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt)
                )
            )
            .groupBy(rateDateSql, AccountEntityTable.instrumentId);
    }

    async countPendingBaseValuationEntries(baseInstrumentId: number, tx?: DB): Promise<number> {
        const [row] = await (tx ?? this.db)
            .select({ count: count(TransactionEntryEntityTable.id) })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    this.buildPendingBaseValuationWhere(baseInstrumentId),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt)
                )
            );

        return row.count;
    }

    async updateBaseValuationBucket(input: BaseValuationBucketUpdateInterface, tx?: DB): Promise<void> {
        (tx ?? this.db).run(sql`
            UPDATE transaction_entries
            SET base_instrument_id = ${input.baseInstrumentId},
                base_exchange_rate = ${input.baseExchangeRate},
                base_amount = ROUND(amount * ${input.baseExchangeRate})
            WHERE id IN (
                SELECT te.id
                FROM transaction_entries te
                INNER JOIN transactions t ON t.id = te.transaction_id
                LEFT JOIN transactions original_t ON original_t.id = te.original_transaction_id
                INNER JOIN accounts a ON a.id = te.account_id
                WHERE date(COALESCE(original_t.operated_at, t.operated_at), 'unixepoch') = ${input.rateDate}
                  AND a.instrument_id = ${input.sourceInstrumentId}
                  AND te.deleted_at IS NULL
                  AND t.deleted_at IS NULL
                  AND a.deleted_at IS NULL
                  AND (
                    te.base_amount IS NULL
                    OR te.base_exchange_rate IS NULL
                    OR te.base_instrument_id IS NULL
                    OR te.base_instrument_id != ${input.baseInstrumentId}
                  )
            )
        `);
    }

    async updateById(id: number, input: TransactionEntryUpdateInputInterface, tx?: DB): Promise<TransactionEntryEntityInterface> {
        const [transactionEntry] = await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set(input)
            .where(eq(TransactionEntryEntityTable.id, id))
            .returning();

        if (!isDefined(transactionEntry)) {
            throw new Error(`Transaction entry ${id} not found`);
        }

        return transactionEntry;
    }

    async findByExternalIdAndAccountId(
        externalId: string,
        accountId: number,
        tx?: DB
    ): Promise<TransactionEntryEntityInterface | undefined> {
        return await (tx ?? this.db).query.TransactionEntryEntityTable.findFirst({
            where: and(
                eq(TransactionEntryEntityTable.externalId, externalId),
                eq(TransactionEntryEntityTable.accountId, accountId),
                isNull(TransactionEntryEntityTable.deletedAt)
            )
        });
    }

    async updateByExternalIdAndAccountId(
        externalId: string,
        accountId: number,
        input: TransactionEntryUpdateInputInterface,
        tx?: DB
    ): Promise<TransactionEntryEntityInterface | undefined> {
        const [transactionEntry] = await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set(input)
            .where(
                and(
                    eq(TransactionEntryEntityTable.externalId, externalId),
                    eq(TransactionEntryEntityTable.accountId, accountId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            )
            .returning();

        return transactionEntry;
    }

    async updateCategoryByTransactionId(
        transactionId: number,
        categoryId: number,
        categorySource: CategorySourceEnum,
        tx?: DB
    ): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ categoryId, categorySource })
            .where(and(eq(TransactionEntryEntityTable.transactionId, transactionId), isNull(TransactionEntryEntityTable.deletedAt)));
    }

    async deleteByTransactionId(transactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
    }

    async deleteLedgerByTransactionId(transactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .delete(TransactionEntryEntityTable)
            .where(
                and(eq(TransactionEntryEntityTable.transactionId, transactionId), isNull(TransactionEntryEntityTable.originalTransactionId))
            );
    }

    async deleteByTransactionIds(transactionIds: number[], tx?: DB): Promise<void> {
        if (isNotEmptyArray(transactionIds)) {
            await (tx ?? this.db)
                .delete(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.transactionId, transactionIds));
        }
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable);
    }

    async archiveByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: new Date() })
            .where(inArray(TransactionEntryEntityTable.accountId, accountIds));
    }

    async restoreByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: null })
            .where(inArray(TransactionEntryEntityTable.accountId, accountIds));
    }

    async deleteByAccountId(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId));
    }

    private buildPendingBaseValuationWhere(baseInstrumentId: number) {
        return or(
            isNull(TransactionEntryEntityTable.baseAmount),
            isNull(TransactionEntryEntityTable.baseExchangeRate),
            isNull(TransactionEntryEntityTable.baseInstrumentId),
            sql`${TransactionEntryEntityTable.baseInstrumentId} != ${baseInstrumentId}`
        );
    }
}
