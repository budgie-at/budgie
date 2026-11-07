import { encodeJson } from '@budgie-at/test-kit';
import { SyncApplyService, SyncUploadService } from '@budgie/cloud-sync';
import { HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb, onDevice } from '../../harness';

const pending = testDb.$client.unsafe('SELECT sync_id FROM sync_pending');

describe('cloud-sync rejected unit restart', () => {
    it.effect('retains a duplicate external-id rejection across a fresh apply service and retries after resolving the collision', () =>
        Effect.gen(function* () {
            const original = yield* seed.account({ title: 'Original' });
            const incoming = yield* seed.account({ title: 'Incoming' });
            yield* testDb.$client.unsafe(
                "INSERT INTO account_external_ids (account_id, external_id, sync_id, sync_zone) VALUES (?, 'duplicate', 'existing-child', ?)",
                [original.id, PERSONAL_SYNC_ZONE]
            );
            const batch = yield* onDevice(
                testDb,
                Effect.flatMap(SyncUploadService, upload => upload.pending(100, new Set(), [PERSONAL_SYNC_ZONE, HOUSEHOLD_SYNC_ZONE], null))
            );
            const record = batch.saves.flatMap(save => save.records).find(item => item.recordName === incoming.syncId);
            expect(record).toBeDefined();
            if (record === undefined) {
                return yield* Effect.die('Missing incoming account');
            }
            const externalIds = encodeJson([{ syncId: 'incoming-child', externalId: 'duplicate' }]);
            const result = yield* onDevice(
                testDb,
                Effect.flatMap(SyncApplyService, apply =>
                    apply.apply({
                        records: [
                            {
                                record: { ...record, encryptedFields: { ...record.encryptedFields, title: 'Remote', externalIds } },
                                systemFields: 'remote'
                            }
                        ],
                        deletions: []
                    })
                )
            );
            expect(result.rejected).toHaveLength(1);
            expect(yield* pending).toEqual([{ sync_id: incoming.syncId }]);
            const restarted = yield* onDevice(
                testDb,
                Effect.flatMap(SyncApplyService, apply => apply.resume())
            );
            expect(restarted.rejected).toHaveLength(1);
            expect(yield* pending).toEqual([{ sync_id: incoming.syncId }]);
            yield* testDb.$client.unsafe("DELETE FROM account_external_ids WHERE sync_id = 'existing-child'");
            const recovered = yield* onDevice(
                testDb,
                Effect.flatMap(SyncApplyService, apply => apply.resume())
            );
            expect(recovered.rejected).toEqual([]);
            expect(yield* pending).toEqual([]);
            expect(
                yield* testDb.$client.unsafe('SELECT account_id FROM account_external_ids WHERE external_id = ?', ['duplicate'])
            ).toEqual([{ account_id: incoming.id }]);
        })
    );
});
