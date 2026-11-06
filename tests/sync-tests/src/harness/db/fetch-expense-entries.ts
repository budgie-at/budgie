import { TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/test-db';

export const fetchExpenseEntries = (transactionId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
