import { TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

import type {} from '@budgie/contracts';

export const fetchCanonicalsOfType = (consolidationType: TransactionConsolidationTypeEnum) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.consolidationType, consolidationType));
    });
