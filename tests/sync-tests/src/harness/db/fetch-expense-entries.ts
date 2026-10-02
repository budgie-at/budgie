import { TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

export const fetchExpenseEntries = (transactionId: number): TransactionEntryEntityInterface[] =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId)).all();
