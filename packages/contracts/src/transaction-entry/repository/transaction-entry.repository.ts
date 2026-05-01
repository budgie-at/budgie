import { Log } from '@budgie/logger';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';
import type { TransactionEntryUpdateInputInterface } from '../input/transaction-entry-update-input.interface';

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
}
