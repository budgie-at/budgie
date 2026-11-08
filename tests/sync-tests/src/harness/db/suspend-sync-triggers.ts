import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

interface SyncTriggerInterface {
    readonly name: string;
    readonly sql: string;
}

export const suspendSyncTriggers = testDb.$client
    .unsafe<SyncTriggerInterface>(`SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND name LIKE '%_sync_outbox_%'`)
    .pipe(
        Effect.tap(triggers => Effect.forEach(triggers, ({ name }) => testDb.$client.unsafe(`DROP TRIGGER ${name}`).raw, { discard: true }))
    );

export const restoreSyncTriggers = (triggers: ReadonlyArray<SyncTriggerInterface>) =>
    Effect.forEach(
        triggers,
        ({ name, sql }) => testDb.$client.unsafe(`DROP TRIGGER IF EXISTS ${name}`).raw.pipe(Effect.andThen(testDb.$client.unsafe(sql).raw)),
        { discard: true }
    );
