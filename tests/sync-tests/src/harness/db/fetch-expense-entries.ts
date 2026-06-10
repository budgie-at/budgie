import { eq } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '@budgie/contracts';

import { testDb } from '../scenario/setup';

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

export const fetchExpenseEntries = (transactionId: number): Promise<TransactionEntryEntityInterface[]> =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
