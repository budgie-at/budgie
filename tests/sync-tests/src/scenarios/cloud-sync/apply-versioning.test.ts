import { TestSeedService, assertStoredBalancesMatchLedger, makeTestDbLayer, resetTestDb } from '@budgie-at/test-kit';
import { SyncApplyService } from '@budgie/cloud-sync';
import { PERSONAL_SYNC_ZONE, HOUSEHOLD_SYNC_ZONE, Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Schema from 'effect/Schema';

import { isRecord } from '@rnw-community/shared';

import {
    FakeCloudTransport,
    testDb,
    onDevice,
    pullDevice,
    pushDevice,
    readOutboxRows,
    refreshAllBalances,
    OPERATED_AT
} from '../../harness';

import type { DB } from '@budgie/contracts';

const DEVICE_B = 'device-b';
const jsonRecord = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown));

const readEnvelope = (database: DB, recordType: string) =>
    database.$client
        .unsafe<{ readonly payload: string }>(`SELECT payload FROM sync_record WHERE record_type = ? LIMIT 1`, [recordType])
        .pipe(
            Effect.flatMap(([row]) => Schema.decodeEffect(jsonRecord)(row.payload)),
            Effect.orDie
        );

const withFields = (envelope: Record<string, unknown>, patch: Record<string, unknown>, overrides: Record<string, unknown> = {}) => {
    const fields = envelope['encryptedFields'];

    return { ...envelope, ...overrides, encryptedFields: { ...(isRecord(fields) ? fields : {}), ...patch } };
};

const LIVE_WALLETS = `accounts WHERE title = 'Wallet' AND deleted_at IS NULL`;

const countWhere = (database: DB, sql: string) =>
    database.$client.unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM ${sql}`).pipe(Effect.map(([row]) => row.total));

const baseline = (deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        yield* resetTestDb(deviceB);

        const seed = new TestSeedService(testDb);
        const account = yield* seed.account({ title: 'Wallet' });
        const transaction = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });
        const tag = yield* seed.tag('Future');

        yield* refreshAllBalances(testDb);
        yield* pushDevice(testDb, cloud);
        yield* pullDevice(deviceB, cloud, DEVICE_B);

        return { account, transaction, tag };
    });

const baselineMove = (deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        yield* baseline(deviceB, cloud);

        const accountEnvelope = yield* readEnvelope(testDb, 'Account');

        return {
            target: withFields(accountEnvelope, { movedFrom: PERSONAL_SYNC_ZONE }, { zone: HOUSEHOLD_SYNC_ZONE }),
            tombstone: withFields(accountEnvelope, { deletedAt: 1_790_000_000_000, movedTo: HOUSEHOLD_SYNC_ZONE })
        };
    });

describe('cloud-sync/apply-versioning', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('pauses the zone on a newer schemaVersion record, keeps its payload and local writes, and resumes after the update', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { transaction, tag } = yield* baseline(deviceB, cloud);
                const tagEnvelope = yield* readEnvelope(testDb, 'Tag');

                yield* deviceB.$client.unsafe(`UPDATE transactions SET title = 'Edited on B'`);
                yield* testDb.$client.unsafe(`UPDATE transactions SET title = 'Remote' WHERE id = ?`, [transaction.id]);
                yield* pushDevice(testDb, cloud);
                cloud.upload([
                    withFields(
                        tagEnvelope,
                        { unknownField: 'kept', title: 'Fresh' },
                        { schemaVersion: 2, recordName: '0192a000-0000-7000-8000-00000000f00d' }
                    )
                ]);

                const results = yield* pullDevice(deviceB, cloud, DEVICE_B);
                const last = results[results.length - 1];

                expect(tag.id).toBeGreaterThan(0);
                expect(last.pausedZones).toEqual([{ syncZone: PERSONAL_SYNC_ZONE, requiredSchemaVersion: 2 }]);
                expect(yield* countWhere(deviceB, `tags WHERE title = 'Fresh'`)).toBe(0);
                expect(yield* countWhere(deviceB, `transactions WHERE title = 'Edited on B'`)).toBe(1);
                expect((yield* readOutboxRows(deviceB)).length).toBeGreaterThan(0);
                expect(
                    yield* countWhere(deviceB, `sync_pending WHERE json_extract(payload, '$.encryptedFields.unknownField') = 'kept'`)
                ).toBe(1);
                expect(
                    yield* onDevice(
                        deviceB,
                        Effect.flatMap(SyncApplyService, service => service.findPausedZones)
                    )
                ).toHaveLength(1);

                yield* deviceB.$client.unsafe(`UPDATE sync_pending SET payload = json_set(payload, '$.schemaVersion', 1)`);

                const resumed = yield* onDevice(
                    deviceB,
                    Effect.flatMap(SyncApplyService, service => service.resume())
                );

                expect(resumed.pausedZones).toEqual([]);
                expect(resumed.rejected).toEqual([]);
                expect(yield* countWhere(deviceB, `tags WHERE title = 'Fresh'`)).toBe(1);
                expect(yield* countWhere(deviceB, `sync_pending`)).toBe(0);
                yield* assertStoredBalancesMatchLedger(deviceB);
            })
        );

        it.effect('ignores a move tombstone that arrives after its target', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { target, tombstone } = yield* baselineMove(deviceB, cloud);

                cloud.upload([target]);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                cloud.upload([tombstone]);

                const afterTombstone = yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(afterTombstone[0].heldBack).toBe(0);
                expect(yield* countWhere(deviceB, LIVE_WALLETS)).toBe(1);
                yield* assertStoredBalancesMatchLedger(deviceB);
                yield* assertStoredBalancesMatchLedger(testDb);
            })
        );

        it.effect('holds a move tombstone that arrives alone until its target arrives', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { target, tombstone } = yield* baselineMove(deviceB, cloud);

                cloud.upload([tombstone]);

                const alone = yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(alone[0].heldBack).toBe(1);
                expect(yield* countWhere(deviceB, `accounts WHERE title = 'Wallet' AND deleted_at IS NOT NULL`)).toBe(0);

                cloud.upload([target]);

                const afterTarget = yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(afterTarget[0].heldBack).toBe(0);
                expect(yield* countWhere(deviceB, LIVE_WALLETS)).toBe(1);
                expect(yield* countWhere(deviceB, `sync_pending`)).toBe(0);
                yield* assertStoredBalancesMatchLedger(deviceB);
                yield* assertStoredBalancesMatchLedger(testDb);
            })
        );
    });
    it.effect('retains all paused records when resume cannot decode a later payload', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                yield* testDb.$client.unsafe(
                    "INSERT INTO sync_pending (sync_zone, sync_id, record_type, missing_record_type, missing_sync_id, payload) VALUES (?, 'first', 'Account', 'SchemaVersion', ?, '{}'), (?, 'second', 'Account', 'SchemaVersion', ?, 'invalid')",
                    [PERSONAL_SYNC_ZONE, PERSONAL_SYNC_ZONE, PERSONAL_SYNC_ZONE, PERSONAL_SYNC_ZONE]
                );
                expect(Exit.isFailure(yield* Effect.exit((yield* SyncApplyService).resume()))).toBe(true);
                expect(yield* testDb.$client.unsafe('SELECT sync_id FROM sync_pending ORDER BY id')).toEqual([
                    { sync_id: 'first' },
                    { sync_id: 'second' }
                ]);
            })
        )
    );
});
