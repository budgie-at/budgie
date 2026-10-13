import { TransactionEntityTable, TransactionEntryEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import { asc, eq, or } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

const snapshotSingleTransactionState = (transactionId: number) =>
    Effect.gen(function* () {
        const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transactionId));
        const entries = yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(
                or(
                    eq(TransactionEntryEntityTable.transactionId, transactionId),
                    eq(TransactionEntryEntityTable.originalTransactionId, transactionId)
                )
            )
            .orderBy(asc(TransactionEntryEntityTable.accountId), asc(TransactionEntryEntityTable.type));
        const tags = yield* testDb
            .select({ tagId: TransactionTagsEntityTable.tagId })
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId))
            .orderBy(asc(TransactionTagsEntityTable.tagId));

        return {
            transactionId,
            comment: transaction.comment,
            consolidationType: transaction.consolidationType,
            consolidationParentTransactionId: transaction.consolidationParentTransactionId,
            deletedAt: transaction.deletedAt,
            tagIds: tags.map(({ tagId }) => tagId),
            entries: entries.map(entry => ({
                transactionId: entry.transactionId,
                originalTransactionId: entry.originalTransactionId,
                accountId: entry.accountId,
                amount: entry.amount,
                type: entry.type,
                kind: entry.kind,
                categoryId: entry.categoryId,
                categorySource: entry.categorySource,
                externalId: entry.externalId,
                deletedAt: entry.deletedAt
            }))
        };
    });

export const snapshotTransactionState = (transactionIds: readonly number[]) =>
    Effect.forEach(transactionIds, transactionId => snapshotSingleTransactionState(transactionId));
