import { TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const fetchExpenseEntries = (transactionId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
    });
