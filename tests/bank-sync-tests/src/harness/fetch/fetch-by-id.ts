import { eq } from 'drizzle-orm';

import { TransactionEntityTable } from '@budgie/contracts';

import { testDb } from '../scenario/setup';

import type { TransactionEntityInterface } from '@budgie/contracts';

export const fetchTransactionById = (id: number): TransactionEntityInterface =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)).all()[0];
