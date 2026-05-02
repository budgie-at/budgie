import { eq } from 'drizzle-orm';

import { TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';

import { testDb } from './setup';

import type { TransactionEntityInterface } from '@budgie/contracts';

export const fetchCanonicalsOfType = (consolidationType: TransactionConsolidationTypeEnum): TransactionEntityInterface[] =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.consolidationType, consolidationType)).all();
