import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    Db,
    DEVICE_A,
    DEVICE_B,
    FakeCloudTransport,
    TestSeedService,
    fetchEntryValuation,
    makeTestDbLayer,
    pullDevice,
    pushDevice,
    readOnlyEntryId,
    readOutboxRows,
    refreshAllBalances,
    resetTestDb,
    seedCryptoSyncAccountOn,
    testDb
} from '../../harness';

import type { DB } from '@budgie/contracts';

const REWARD_AT = new Date('2026-05-10T09:00:00.000Z');

const seedReward = (database: DB, accountId: number, baseInstrumentId: number, baseExchangeRate: number | null, baseAmount: number) =>
    Effect.gen(function* () {
        const seeded = yield* new TestSeedService(database).valuedIncome({
            accountId,
            amount: PRECISION,
            operatedAt: REWARD_AT,
            title: 'Reward',
            baseInstrumentId,
            baseExchangeRate,
            baseAmount
        });

        yield* refreshAllBalances(database);

        return seeded;
    });

describe('cloud-sync/derived-base-valuation', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('keeps a local Priced value when the unchanged entry comes back Estimated', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const { entry } = yield* seedReward(testDb, account.id, euroId, 50_000, 50_000 * PRECISION);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* deviceB.$client.unsafe('UPDATE transaction_entries SET base_exchange_rate = NULL, base_amount = ?', [
                    48_000 * PRECISION
                ]);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: 50_000,
                    baseAmount: 50_000 * PRECISION
                });
                expect(yield* readOutboxRows(testDb)).toHaveLength(0);
            })
        );

        it.effect('stores the incoming base value when the amount changed remotely', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const { entry } = yield* seedReward(testDb, account.id, euroId, 50_000, 50_000 * PRECISION);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* deviceB.$client.unsafe('UPDATE transaction_entries SET amount = ?, base_exchange_rate = NULL, base_amount = ?', [
                    2 * PRECISION,
                    96_000 * PRECISION
                ]);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: null,
                    baseAmount: 96_000 * PRECISION
                });
                expect(yield* readOnlyEntryId(testDb)).toBe(entry.id);
            })
        );
    });
});
