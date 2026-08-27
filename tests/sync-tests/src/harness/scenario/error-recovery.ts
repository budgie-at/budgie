import { SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { expect } from 'vitest';

import { testDb } from './setup';

export const SYNC_ERROR_THRESHOLD = 3;

export const httpFailureCases = [
    { label: '401 unauthorized', status: 401 },
    { label: '429 rate limited', status: 429 }
] as const;

export const expectSyncFailedAndDisabled = (syncId: number, minimumErrorCount = SYNC_ERROR_THRESHOLD): void => {
    const [finalSync] = testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, syncId)).all();

    expect(finalSync.errorCount).toBeGreaterThanOrEqual(minimumErrorCount);
    expect(finalSync.enabled).toBe(false);
    expect(finalSync.status).toBe('FAILED');
    expect(finalSync.lastError).not.toBeNull();
};
