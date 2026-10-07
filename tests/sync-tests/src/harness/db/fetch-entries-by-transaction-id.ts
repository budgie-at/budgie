import { TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchEntriesByTransactionId = (transactionId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
