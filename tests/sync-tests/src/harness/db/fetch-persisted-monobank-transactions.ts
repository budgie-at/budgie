import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

export const fetchPersistedMonobankTransactions = Effect.suspend(() =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK))
);
