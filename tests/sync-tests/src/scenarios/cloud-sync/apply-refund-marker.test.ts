import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Predicate from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import {
    Db,
    FakeCloudTransport,
    makeTestDbLayer,
    testDb,
    pullDevice,
    pushDevice,
    pushSeededExpense,
    readOutboxRows,
    DEVICE_A,
    DEVICE_B
} from '../../harness';

import type { DB } from '@budgie/contracts';

const MARKER_FIELD = 'refundAutoPairDisabled';
const MARKER_COLUMN = 'refund_auto_pair_disabled';

const seedBaseline = Effect.gen(function* () {
    const deviceB = yield* Db;
    const cloud = new FakeCloudTransport();

    yield* pushSeededExpense(deviceB, cloud);
    yield* pullDevice(deviceB, cloud, DEVICE_B);
    yield* pullDevice(testDb, cloud, DEVICE_A);

    const [transaction] = yield* testDb.$client.unsafe<{ readonly syncZone: string; readonly syncId: string }>(
        `SELECT sync_zone AS syncZone, sync_id AS syncId FROM transactions`
    );

    return { deviceB, cloud, transaction };
});

const PayloadJson = Schema.fromJsonString(Schema.Unknown);

const omitMarker = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(omitMarker);
    }

    return Predicate.isObject(value)
        ? Object.fromEntries(Object.entries(value).flatMap(([key, child]) => (key === MARKER_FIELD ? [] : [[key, omitMarker(child)]])))
        : value;
};

const markLocally = testDb.$client.unsafe(`UPDATE transactions SET ${MARKER_COLUMN} = 1`);

const editTitleAsUser = (database: DB) => database.$client.unsafe(`UPDATE transactions SET title = 'Cafe edited', updated_by = 'user'`);

const readMarker = (database: DB) =>
    database.$client
        .unsafe<{ readonly isDisabled: number }>(`SELECT ${MARKER_COLUMN} AS isDisabled FROM transactions`)
        .pipe(Effect.map(([row]) => row.isDisabled));

const hasPendingMarker = Effect.map(readOutboxRows(testDb), rows =>
    rows.some(row => row.recordType === 'Transaction' && row.changedColumns.includes(MARKER_COLUMN))
);

describe('cloud-sync/apply-refund-marker', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('keeps a pending local refund marker when the incoming record omits the field', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, transaction } = yield* seedBaseline;

                yield* markLocally;
                yield* editTitleAsUser(deviceB);
                yield* pushDevice(deviceB, cloud);
                cloud.omitField(transaction.syncZone, transaction.syncId, MARKER_FIELD);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* readMarker(testDb)).toBe(1);
                expect(yield* hasPendingMarker).toBe(true);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(yield* readMarker(deviceB)).toBe(1);
            })
        );

        it.effect('keeps a pending local refund marker when the stored base record predates the field', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, transaction } = yield* seedBaseline;
                const [stored] = yield* testDb.$client.unsafe<{ readonly payload: string }>(
                    `SELECT payload FROM sync_record WHERE sync_zone = ? AND sync_id = ?`,
                    [transaction.syncZone, transaction.syncId]
                );
                const legacyPayload = yield* Effect.flatMap(Schema.decodeEffect(PayloadJson)(stored.payload), payload =>
                    Schema.encodeEffect(PayloadJson)(omitMarker(payload))
                );

                yield* testDb.$client.unsafe(`UPDATE sync_record SET payload = ? WHERE sync_zone = ? AND sync_id = ?`, [
                    legacyPayload,
                    transaction.syncZone,
                    transaction.syncId
                ]);
                yield* markLocally;
                yield* editTitleAsUser(deviceB);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* readMarker(testDb)).toBe(1);
                expect(yield* hasPendingMarker).toBe(true);
            })
        );
        it.effect('re-uploads a synced refund marker when an incoming record omits it and nothing is pending', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, transaction } = yield* seedBaseline;

                yield* markLocally;
                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* editTitleAsUser(deviceB);
                yield* pushDevice(deviceB, cloud);
                cloud.omitField(transaction.syncZone, transaction.syncId, MARKER_FIELD);

                expect(yield* hasPendingMarker).toBe(false);

                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* readMarker(testDb)).toBe(1);
                expect(yield* hasPendingMarker).toBe(true);
            })
        );

        it.effect('keeps a synced refund marker when a peer that never saw it uploads an unrelated edit', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, transaction } = yield* seedBaseline;

                yield* markLocally;
                yield* pushDevice(testDb, cloud);
                cloud.omitField(transaction.syncZone, transaction.syncId, MARKER_FIELD);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(yield* readMarker(deviceB)).toBe(0);

                yield* editTitleAsUser(deviceB);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* readMarker(testDb)).toBe(1);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(yield* readMarker(deviceB)).toBe(1);
            })
        );
    });
});
