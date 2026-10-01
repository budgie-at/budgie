import { SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { fetchPersistedMonobankTransactions } from './fetch-persisted-monobank-transactions';
import { fetchSyncById } from './fetch-sync-by-id';

export const expectForwardSyncWithoutHistory = (syncId: number) =>
    Effect.gen(function* () {
        expect(yield* fetchPersistedMonobankTransactions()).toHaveLength(0);
        expect((yield* fetchSyncById(syncId)).mode).toBe(SyncModeEnum.FORWARD);
    });
