import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';
import { subtractMonths } from '../scenario/subtract-months';

import { setupMonobankFixture } from './setup-monobank-fixture';

export const setupBackwardSweepFixture = (sweepStart: Date, historyMonths?: number) =>
    Effect.gen(function* () {
        const { sync } = yield* setupMonobankFixture('mono-acc-1', SyncModeEnum.BACKWARD, sweepStart);
        yield* testDb
            .update(SyncEntityTable)
            .set({
                backwardSyncFromAt: sweepStart,
                backwardSyncedAt: null,
                forwardSyncedAt: sweepStart,
                ...(isDefined(historyMonths) && { backwardSyncLimitAt: subtractMonths(sweepStart, historyMonths) })
            })
            .where(eq(SyncEntityTable.id, sync.id));

        return sync;
    });
