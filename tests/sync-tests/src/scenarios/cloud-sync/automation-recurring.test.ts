import { makeTestDbLayer, TestSeedService } from '@budgie-at/test-kit';
import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    testDb,
    pullDevice,
    pushDevice,
    refreshAllBalances,
    bootstrapMonoDevices,
    detectRecurring,
    dismissSeries,
    expectSettled,
    firstAccountIdOf,
    pullWithAutomation,
    settleDevices
} from '../../harness';

import type { FakeCloudTransport } from '../../harness';
import type { DB } from '@budgie/contracts';

const DAY_MS = 86_400_000;
const FIRST_WINDOW_DAYS_AGO = [151, 121, 91] as const;
const SECOND_WINDOW_DAYS_AGO = [61, 31, 1] as const;
const CHARGE_TITLE = 'NETFLIX';

interface SeriesRowInterface {
    readonly syncId: string;
    readonly userState: string;
    readonly status: string;
    readonly amount: number;
    readonly lastSeenAt: number;
    readonly deletedAt: number | null;
}

const seedCharges = (database: DB, daysAgo: readonly number[]) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const accountId = yield* firstAccountIdOf(database);

        for (const days of daysAgo) {
            const { id } = yield* seed.bankPairExpense(
                { externalId: `${CHARGE_TITLE}-${days}`, operatedAt: new Date(Date.now() - days * DAY_MS) },
                { accountId, amount: 12 * PRECISION }
            );

            yield* seed.updateTransaction(id, { title: CHARGE_TITLE });
        }
    });

const readSeries = (database: DB) =>
    database.$client.unsafe<SeriesRowInterface>(
        `SELECT sync_id AS syncId, user_state AS userState, status, amount, last_seen_at AS lastSeenAt, deleted_at AS deletedAt
        FROM recurring_series ORDER BY sync_id`
    );

const liveSeries = (database: DB) => readSeries(database).pipe(Effect.map(rows => rows.filter(({ deletedAt }) => deletedAt === null)));

const expectConverged = (deviceB: DB, rounds: number) =>
    Effect.gen(function* () {
        yield* expectSettled(deviceB, rounds, 5);
        expect(yield* readSeries(testDb)).toEqual(yield* readSeries(deviceB));
    });

const detectOnBoth = (deviceB: DB) =>
    Effect.gen(function* () {
        yield* detectRecurring(testDb);
        yield* detectRecurring(deviceB);
    });

const seedLongHistoryAndDismiss = (deviceB: DB, cloud: FakeCloudTransport, syncBeforeDetect: boolean) =>
    Effect.gen(function* () {
        yield* seedCharges(testDb, [...FIRST_WINDOW_DAYS_AGO, ...SECOND_WINDOW_DAYS_AGO]);
        yield* refreshAllBalances(testDb);

        if (syncBeforeDetect) {
            yield* pushDevice(testDb, cloud);
            yield* pullDevice(deviceB, cloud, 'device-b');
            yield* detectOnBoth(deviceB);
        } else {
            yield* detectRecurring(testDb);
        }

        yield* dismissSeries(testDb);
    });

describe('cloud-sync/automation-recurring', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('converges a series derived from different input windows into one record', () =>
            Effect.gen(function* () {
                const { deviceB, cloud } = yield* bootstrapMonoDevices;

                yield* seedCharges(testDb, FIRST_WINDOW_DAYS_AGO);
                yield* seedCharges(deviceB, SECOND_WINDOW_DAYS_AGO);
                yield* refreshAllBalances(testDb);
                yield* refreshAllBalances(deviceB);
                yield* detectOnBoth(deviceB);

                const derivedOnA = yield* liveSeries(testDb);
                const derivedOnB = yield* liveSeries(deviceB);

                expect(derivedOnA).toHaveLength(1);
                expect(derivedOnB).toHaveLength(1);
                expect(derivedOnA[0].syncId).not.toBe(derivedOnB[0].syncId);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);
                const convergedOnA = yield* liveSeries(testDb);
                const convergedOnB = yield* liveSeries(deviceB);

                expect(convergedOnA).toHaveLength(1);
                expect(convergedOnB).toHaveLength(1);
                expect(convergedOnA[0].syncId).toBe([derivedOnA[0].syncId, derivedOnB[0].syncId].sort()[0]);
                expect(convergedOnA).toEqual(convergedOnB);
                expect(convergedOnA[0].status).toBe('ACTIVE');
                yield* expectConverged(deviceB, rounds);
            })
        );

        it.effect('does not re-derive a dismissed series on the other device', () =>
            Effect.gen(function* () {
                const { deviceB, cloud } = yield* bootstrapMonoDevices;

                yield* seedLongHistoryAndDismiss(deviceB, cloud, false);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);
                const onB = yield* liveSeries(deviceB);

                expect(onB).toHaveLength(1);
                expect(onB[0].userState).toBe('DISMISSED');
                yield* detectRecurring(deviceB);
                yield* pullWithAutomation(deviceB, cloud, 'device-b');
                expect(yield* readSeries(deviceB)).toEqual(yield* readSeries(testDb));
                yield* expectConverged(deviceB, rounds);
            })
        );

        it.effect('keeps a series dismissed when the other device derived it independently before the dismissal arrived', () =>
            Effect.gen(function* () {
                const { deviceB, cloud } = yield* bootstrapMonoDevices;

                yield* seedLongHistoryAndDismiss(deviceB, cloud, true);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);
                const onA = yield* liveSeries(testDb);
                const onB = yield* liveSeries(deviceB);

                expect(onA).toHaveLength(1);
                expect(onB).toHaveLength(1);
                expect(onA[0].userState).toBe('DISMISSED');
                expect(onB[0].userState).toBe('DISMISSED');
                yield* detectRecurring(deviceB);
                expect(yield* liveSeries(deviceB)).toEqual(onB);
                yield* expectConverged(deviceB, rounds);
            })
        );
    });
});
