import { type BankSyncEntityInterface, BankSyncEntityTable, BankSyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

import { setupMonobankFixture } from './setup-monobank-fixture';

const FIXTURE_FORWARD_FROM = new Date('2026-01-01T00:00:00Z');

export const setupBackwardSweepFixture = (sweepStart: Date): BankSyncEntityInterface => {
    const { bankSync } = setupMonobankFixture('mono-acc-1', BankSyncModeEnum.BACKWARD, FIXTURE_FORWARD_FROM);
    testDb
        .update(BankSyncEntityTable)
        .set({ backwardSyncFromAt: sweepStart, backwardSyncedAt: null, forwardSyncedAt: sweepStart })
        .where(eq(BankSyncEntityTable.id, bankSync.id))
        .run();

    return bankSync;
};
