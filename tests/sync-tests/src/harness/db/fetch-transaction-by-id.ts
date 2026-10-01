import { TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';


export const fetchTransactionById = (id: number) =>
    Effect.gen(function* () {
        return (yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, id)))[0];
    });
