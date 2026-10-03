import { SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const fetchSyncById = (id: number) =>
    Effect.gen(function* () {
        const [row] = yield* testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, id));

        return row;
    });
