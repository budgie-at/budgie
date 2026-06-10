import { type SyncEntityInterface, SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

import { setupMonobankFixture } from './setup-monobank-fixture';

const FIXTURE_FORWARD_FROM = new Date('2026-01-01T00:00:00Z');

export const setupBackwardSweepFixture = (sweepStart: Date): SyncEntityInterface => {
    const { bankSync } = setupMonobankFixture('mono-acc-1', SyncModeEnum.BACKWARD, FIXTURE_FORWARD_FROM);
    testDb
        .update(SyncEntityTable)
        .set({ backwardSyncFromAt: sweepStart, backwardSyncedAt: null, forwardSyncedAt: sweepStart })
        .where(eq(SyncEntityTable.id, bankSync.id))
        .run();

    return bankSync;
};
