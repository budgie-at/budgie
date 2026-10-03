import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

import { setupMonobankFixture } from './setup-monobank-fixture';

const FIXTURE_FORWARD_FROM = new Date('2026-01-01T00:00:00Z');

export const setupBackwardSweepFixture = (sweepStart: Date) =>
    Effect.gen(function* () {
        const { sync } = yield* setupMonobankFixture('mono-acc-1', SyncModeEnum.BACKWARD, FIXTURE_FORWARD_FROM);
        yield* testDb
            .update(SyncEntityTable)
            .set({ backwardSyncFromAt: sweepStart, backwardSyncedAt: null, forwardSyncedAt: sweepStart })
            .where(eq(SyncEntityTable.id, sync.id));

        return sync;
    });
