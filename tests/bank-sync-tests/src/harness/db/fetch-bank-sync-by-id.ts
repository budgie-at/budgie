import { type SyncEntityInterface, SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchBankSyncById = (id: number): SyncEntityInterface => {
    const [row] = testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, id)).all();

    return row;
};
