import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchPersistedMonobankTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK));
