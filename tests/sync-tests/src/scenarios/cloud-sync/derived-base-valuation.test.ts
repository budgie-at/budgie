import { SyncAutomationService } from '@budgie/cloud-sync';
import { AccountTypeEnum, InstrumentTypeEnum, PRECISION } from '@budgie/contracts';
import { MarketPricedRevaluationService } from '@budgie/market';
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
    onAutomatedDevice,
    onMarketDevice,
    pullDevice,
    pushDevice,
    readIsApplying,
    readOnlyEntryId,
    readOutboxRows,
    refreshAllBalances,
    resetTestDb,
    seedCryptoSyncAccountOn,
    seedDailyPrice,
    testDb,
    useEuroBase
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

        it.effect('stores the incoming base value when the parent operated_at changed remotely', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const { entry } = yield* seedReward(testDb, account.id, euroId, 50_000, 50_000 * PRECISION);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* deviceB.$client.unsafe('UPDATE transactions SET operated_at = ?', [
                    Math.floor(new Date('2026-05-11T09:00:00.000Z').getTime() / 1000)
                ]);
                yield* deviceB.$client.unsafe('UPDATE transaction_entries SET base_exchange_rate = NULL, base_amount = ?', [
                    48_000 * PRECISION
                ]);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: null,
                    baseAmount: 48_000 * PRECISION
                });
            })
        );

        it.effect('stores the incoming base value when the entry account changed remotely', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const otherAccount = yield* new TestSeedService(testDb).account({
                    title: 'BTC two',
                    instrumentId: account.instrumentId,
                    type: AccountTypeEnum.CRYPTO_SYNC
                });
                const { entry } = yield* seedReward(testDb, account.id, euroId, 50_000, 50_000 * PRECISION);

                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* deviceB.$client.unsafe(
                    "UPDATE transaction_entries SET account_id = (SELECT id FROM accounts WHERE title = 'BTC two'), base_exchange_rate = NULL, base_amount = ?",
                    [48_000 * PRECISION]
                );
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* fetchEntryValuation(testDb, entry.id)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: null,
                    baseAmount: 48_000 * PRECISION
                });
                expect(otherAccount.id).not.toBe(account.id);
            })
        );

        it.effect('computes nothing inside apply and re-checks the entry right after it, without outbox rows', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, coinId, account } = yield* seedCryptoSyncAccountOn(deviceB);

                yield* seedReward(deviceB, account.id, euroId, null, 48_000 * PRECISION);
                yield* pushDevice(deviceB, cloud);
                yield* useEuroBase(testDb);
                yield* onMarketDevice(testDb, seedDailyPrice(coinId, euroId, '2026-05-10', 50_000));

                const results = yield* pullDevice(testDb, cloud, DEVICE_A);
                const entryId = yield* readOnlyEntryId(testDb);

                expect(yield* fetchEntryValuation(testDb, entryId)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: null,
                    baseAmount: 48_000 * PRECISION
                });
                expect(yield* readIsApplying(testDb)).toBe(0);

                yield* onAutomatedDevice(
                    testDb,
                    Effect.flatMap(SyncAutomationService, service =>
                        Effect.forEach(results, result => service.afterApply(result), { discard: true })
                    )
                );

                expect(yield* fetchEntryValuation(testDb, entryId)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: 50_000,
                    baseAmount: 50_000 * PRECISION
                });
                expect(yield* readOutboxRows(testDb)).toHaveLength(0);
                expect(yield* readIsApplying(testDb)).toBe(0);
            })
        );

        it.effect('converges two devices with unequal price coverage once both hold the price', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const revalueDay = (coinId: number) =>
                    Effect.flatMap(MarketPricedRevaluationService, service =>
                        service.revalueInstrumentRange(coinId, '2026-05-10', '2026-05-10')
                    );

                yield* resetTestDb(deviceB);

                const { euroId, coinId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const { entry } = yield* seedReward(testDb, account.id, euroId, null, 48_000 * PRECISION);

                yield* pushDevice(testDb, cloud);
                yield* useEuroBase(deviceB);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                yield* onMarketDevice(
                    testDb,
                    seedDailyPrice(coinId, euroId, '2026-05-10', 50_000).pipe(Effect.andThen(revalueDay(coinId)))
                );

                const remoteEntryId = yield* readOnlyEntryId(deviceB);

                expect((yield* fetchEntryValuation(deviceB, remoteEntryId)).baseExchangeRate).toBeNull();

                yield* onMarketDevice(
                    deviceB,
                    seedDailyPrice(coinId, euroId, '2026-05-10', 50_000).pipe(Effect.andThen(revalueDay(coinId)))
                );

                expect(yield* fetchEntryValuation(deviceB, remoteEntryId)).toStrictEqual(yield* fetchEntryValuation(testDb, entry.id));
                expect((yield* fetchEntryValuation(testDb, entry.id)).baseExchangeRate).toBe(50_000);
                expect(yield* readOutboxRows(testDb)).toHaveLength(0);
                expect(yield* readOutboxRows(deviceB)).toHaveLength(0);
            })
        );

        it.effect('keeps a synced value on a device without prices and re-values it once its first price lands', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const { euroId, coinId, account } = yield* seedCryptoSyncAccountOn(testDb);

                yield* seedReward(testDb, account.id, euroId, 1, PRECISION);
                yield* pushDevice(testDb, cloud);
                yield* useEuroBase(deviceB);
                yield* deviceB.$client.unsafe('DELETE FROM instrument_daily_market_prices WHERE instrument_id = ?', [coinId]);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                const remoteEntryId = yield* readOnlyEntryId(deviceB);

                yield* onMarketDevice(
                    deviceB,
                    Effect.flatMap(MarketPricedRevaluationService, service => service.runCryptoStrictValuationStep())
                );

                expect(yield* fetchEntryValuation(deviceB, remoteEntryId)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: 1,
                    baseAmount: PRECISION
                });

                yield* onMarketDevice(
                    deviceB,
                    seedDailyPrice(coinId, euroId, '2026-05-10', 50_000).pipe(
                        Effect.andThen(
                            Effect.flatMap(MarketPricedRevaluationService, service =>
                                service.repairAfterPriceJob(
                                    { instrumentId: coinId, fromDate: '2026-05-01', toDate: '2026-05-10' },
                                    InstrumentTypeEnum.CRYPTO,
                                    true
                                )
                            )
                        )
                    )
                );

                expect(yield* fetchEntryValuation(deviceB, remoteEntryId)).toStrictEqual({
                    baseInstrumentId: euroId,
                    baseExchangeRate: 50_000,
                    baseAmount: 50_000 * PRECISION
                });
            })
        );

        it.effect('writes base revaluations without outbox rows and still captures a user edit right after them', () =>
            Effect.gen(function* () {
                const cloud = new FakeCloudTransport();
                const { euroId, coinId, account } = yield* seedCryptoSyncAccountOn(testDb);
                const seedTestDb = new TestSeedService(testDb);

                yield* Effect.forEach(
                    Array.from({ length: 201 }, (_, index) => index),
                    index =>
                        seedTestDb.valuedIncome({
                            accountId: account.id,
                            amount: PRECISION,
                            operatedAt: new Date(REWARD_AT.getTime() + index * 1000),
                            title: `Reward ${index}`,
                            baseInstrumentId: euroId,
                            baseExchangeRate: null,
                            baseAmount: 48_000 * PRECISION
                        }),
                    { discard: true }
                );
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                yield* onMarketDevice(
                    testDb,
                    seedDailyPrice(coinId, euroId, '2026-05-10', 50_000).pipe(
                        Effect.andThen(
                            Effect.flatMap(MarketPricedRevaluationService, service =>
                                service.revalueInstrumentRange(coinId, '2026-05-10', '2026-05-10')
                            )
                        )
                    )
                );

                expect(yield* readOutboxRows(testDb)).toHaveLength(0);
                expect(yield* readIsApplying(testDb)).toBe(0);

                yield* testDb.$client.unsafe(
                    'UPDATE transaction_entries SET amount = ? WHERE id = (SELECT MIN(id) FROM transaction_entries)',
                    [3 * PRECISION]
                );
                yield* refreshAllBalances(testDb);

                expect(yield* readOutboxRows(testDb)).toHaveLength(1);
            })
        );
    });
});
