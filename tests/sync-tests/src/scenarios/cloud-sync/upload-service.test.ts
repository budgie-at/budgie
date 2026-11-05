import { Db, ExternalSourceEnum, PERSONAL_SYNC_ZONE, SyncUploadService } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb } from '../../harness';

import type { SyncUploadSaveInterface } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');

const clearOutbox = testDb.$client.unsafe('DELETE FROM sync_outbox');

const readOutbox = testDb.$client.unsafe<{ readonly syncId: string; readonly syncRevision: number }>(
    'SELECT sync_id AS syncId, sync_revision AS syncRevision FROM sync_outbox ORDER BY id'
);

const readLastLocalChange = testDb.$client
    .unsafe<{ readonly value: number | null }>('SELECT last_local_change_at AS value FROM sync_apply_state WHERE id = 1')
    .pipe(Effect.map(([row]) => row?.value ?? null));

const resetLastLocalChange = testDb.$client.unsafe(
    `INSERT INTO sync_apply_state (id, last_local_change_at) VALUES (1, 0) ON CONFLICT (id) DO UPDATE SET last_local_change_at = 0`
);

const setApplying = (isApplying: boolean) =>
    testDb.$client.unsafe(
        `INSERT INTO sync_apply_state (id, is_applying) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET is_applying = excluded.is_applying`,
        [isApplying ? 1 : 0]
    );

const toAcknowledgement = (save: SyncUploadSaveInterface) => ({
    syncZone: save.syncZone,
    syncId: save.syncId,
    syncRevision: save.syncRevision,
    sentRecords: save.records.map(record => ({ record, systemFields: '{"changeTag":"1"}' })),
    deletedTargets: []
});

const withUpload = <A, E>(effect: Effect.Effect<A, E, SyncUploadService | Db>) =>
    effect.pipe(Effect.provide(SyncUploadService.layer), Effect.provideService(Db, testDb));

describe('cloud-sync/upload-service', () => {
    it.effect('returns one record per changed aggregate in the aggregate zone', () =>
        withUpload(
            Effect.gen(function* () {
                const uploadService = yield* SyncUploadService;
                const account = yield* seed.account({ title: 'Cash' });

                yield* clearOutbox;
                yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });

                const batch = yield* uploadService.pending(10);

                expect(batch.deletions).toHaveLength(0);
                expect(batch.rejections).toHaveLength(0);
                expect(batch.saves).toHaveLength(1);
                expect(batch.saves[0].records).toHaveLength(1);
                expect(batch.saves[0].records[0]).toMatchObject({ recordType: 'Transaction', zone: PERSONAL_SYNC_ZONE });
                expect(batch.saves[0].records[0].recordName).toBe(batch.saves[0].syncId);
                expect(batch.saves[0].changedFields.length).toBeGreaterThan(0);
            })
        )
    );

    it.effect('keeps the outbox row when it was edited during the upload and stores the merge base', () =>
        withUpload(
            Effect.gen(function* () {
                const uploadService = yield* SyncUploadService;
                const account = yield* seed.account({ title: 'Cash' });
                const transaction = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });
                const firstBatch = yield* uploadService.pending(10);
                const sent = firstBatch.saves.find(save => save.records[0].recordType === 'Transaction');

                if (sent === undefined) {
                    return yield* Effect.die('transaction save missing');
                }

                yield* testDb.$client.unsafe('UPDATE transactions SET title = ? WHERE id = ?', ['Cafe edited', transaction.id]);
                yield* uploadService.acknowledge([toAcknowledgement(sent)]);

                const remaining = yield* readOutbox;
                const [stored] = yield* testDb.$client.unsafe<{ readonly systemFields: string; readonly payload: string }>(
                    'SELECT system_fields AS systemFields, payload FROM sync_record WHERE sync_id = ?',
                    [sent.syncId]
                );

                expect(remaining.map(row => row.syncId)).toContain(sent.syncId);
                expect(stored.systemFields).toBe('{"changeTag":"1"}');
                expect(JSON.parse(stored.payload)).toEqual(sent.records[0].encryptedFields);

                const secondBatch = yield* uploadService.pending(10);
                const resent = secondBatch.saves.find(save => save.syncId === sent.syncId);

                expect(resent?.changedFields).toContain('title');
                yield* uploadService.acknowledge([toAcknowledgement(resent ?? sent)]);

                expect((yield* readOutbox).map(row => row.syncId)).not.toContain(sent.syncId);
            })
        )
    );

    it.effect('emits a deletion by record name and zone for a deleted parent', () =>
        withUpload(
            Effect.gen(function* () {
                const uploadService = yield* SyncUploadService;
                const tag = yield* seed.tag('Coffee');
                const [identity] = yield* testDb.$client.unsafe<{ readonly syncId: string; readonly syncZone: string }>(
                    'SELECT sync_id AS syncId, sync_zone AS syncZone FROM tags WHERE id = ?',
                    [tag.id]
                );

                yield* clearOutbox;
                yield* testDb.$client.unsafe('DELETE FROM tags WHERE id = ?', [tag.id]);

                const batch = yield* uploadService.pending(10);

                expect(batch.saves).toHaveLength(0);
                expect(batch.deletions).toHaveLength(1);
                expect(batch.deletions[0].targets).toEqual([{ recordName: identity.syncId, zone: identity.syncZone }]);
            })
        )
    );

    it.effect('syncs owner_install_id in the bank integration record and never the token', () =>
        withUpload(
            Effect.gen(function* () {
                const uploadService = yield* SyncUploadService;
                const integration = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, token: 'secret-token', label: 'Mono' });

                yield* testDb.$client.unsafe('UPDATE bank_integrations SET owner_install_id = ? WHERE id = ?', ['install-a', integration.id]);

                const batch = yield* uploadService.pending(50);
                const save = batch.saves.find(candidate => candidate.records[0].recordType === 'BankIntegration');
                const fields = save?.records[0].encryptedFields ?? {};

                expect(Object.values(fields)).toContain('install-a');
                expect(JSON.stringify(fields)).not.toContain('secret-token');
                expect(save?.changedFields.some(field => /owner/i.test(field))).toBe(true);
            })
        )
    );

    it.effect('advances last_local_change_at on a local edit and not while applying', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ title: 'Cash' });

            yield* resetLastLocalChange;
            yield* testDb.$client.unsafe('UPDATE accounts SET title = ? WHERE id = ?', ['Wallet', account.id]);

            expect(yield* readLastLocalChange).toBeGreaterThan(0);

            yield* resetLastLocalChange;
            yield* setApplying(true);
            yield* testDb.$client.unsafe('UPDATE accounts SET title = ? WHERE id = ?', ['Purse', account.id]);
            yield* setApplying(false);

            expect(yield* readLastLocalChange).toBe(0);
        })
    );
});
