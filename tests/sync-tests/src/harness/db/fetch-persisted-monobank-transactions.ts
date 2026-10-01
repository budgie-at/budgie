import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const fetchPersistedMonobankTransactions = () =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK));
    });
