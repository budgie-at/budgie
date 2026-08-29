import { type SyncEntityInterface, SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchSyncById = (id: number): SyncEntityInterface => {
    const [row] = testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, id)).all();

    return row;
};
