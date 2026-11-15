import { ExternalSourceEnum, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { asc, eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { testDb } from '../scenario/test-db';

export const fetchSourceLedger = Effect.fnUntraced(function* (source: ExternalSourceEnum) {
    const transactions = yield* testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, source))
        .orderBy(asc(TransactionEntityTable.id));
    const entries = isNotEmptyArray(transactions)
        ? yield* testDb
              .select()
              .from(TransactionEntryEntityTable)
              .where(
                  inArray(
                      TransactionEntryEntityTable.transactionId,
                      transactions.map(({ id }) => id)
                  )
              )
              .orderBy(asc(TransactionEntryEntityTable.id))
        : [];

    return transactions.map(
        ({
            id,
            externalId,
            type,
            title,
            comment,
            operatedAt,
            fromAccountId,
            toAccountId,
            fundAccountId,
            yieldKind,
            yieldSourceAccountId
        }) => ({
            id,
            externalId,
            type,
            title,
            comment,
            operatedAt,
            fromAccountId,
            toAccountId,
            fundAccountId,
            yieldKind,
            yieldSourceAccountId,
            entries: entries
                .filter(({ transactionId }) => transactionId === id)
                .map(({ accountId, type: entryType, amount, categoryId }) => ({ accountId, type: entryType, amount, categoryId }))
        })
    );
});
