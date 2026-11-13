import { AccountTypeEnum, InstrumentEntityTable, InstrumentPriceProviderEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    Db,
    FakeCloudTransport,
    TestSeedService,
    assertStoredBalancesMatchLedger,
    makeTestDbLayer,
    resetTestDb,
    testDb,
    pullDevice,
    pushDevice,
    refreshAllBalances,
    DEVICE_B,
    OPERATED_AT
} from '../../harness';

describe('cloud-sync/runtime-instrument', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('delivers a stock instrument and buy transfer using local quote currency ids', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const seed = new TestSeedService(testDb);
                yield* resetTestDb(deviceB);
                const [quote] = yield* testDb.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, 'USD'));
                const [instrument] = yield* testDb
                    .insert(InstrumentEntityTable)
                    .values({
                        code: 'TEST:AAPL',
                        name: 'Apple',
                        symbol: 'AAPL',
                        type: InstrumentTypeEnum.EQUITY,
                        priceProvider: InstrumentPriceProviderEnum.YAHOO,
                        providerInstrumentId: 'AAPL',
                        quoteInstrumentId: quote.id
                    })
                    .returning();
                yield* deviceB.insert(InstrumentEntityTable).values({
                    code: 'TEST:LOCAL',
                    name: 'Local only',
                    symbol: 'LOCAL',
                    type: InstrumentTypeEnum.EQUITY
                });
                const cash = yield* seed.account({ title: 'Cash', instrumentId: quote.id });
                const stocks = yield* seed.account({ title: 'Apple', type: AccountTypeEnum.STOCKS, instrumentId: instrument.id });
                yield* seed.directTransfer({
                    exchangeRate: 0.01,
                    operatedAt: OPERATED_AT,
                    sourceAccountId: cash.id,
                    sourceAmount: 200_000_000,
                    sourceEntryExchangeRate: 1,
                    targetAccountId: stocks.id,
                    targetAmount: 2_000_000,
                    title: 'Buy Apple',
                    toIban: null
                });
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                const results = yield* pullDevice(deviceB, cloud, DEVICE_B, { order: 'reverse', chunkSize: 1 });
                expect(results.at(-1)?.heldBack).toBe(0);
                const received = yield* deviceB.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, instrument.code));
                const [localQuote] = yield* deviceB.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, 'USD'));
                expect(received).toHaveLength(1);
                expect(received[0]).toMatchObject({
                    code: instrument.code,
                    name: instrument.name,
                    symbol: instrument.symbol,
                    type: instrument.type,
                    priceProvider: instrument.priceProvider,
                    providerInstrumentId: instrument.providerInstrumentId,
                    quoteInstrumentId: localQuote.id
                });
                expect(received[0].id).not.toBe(instrument.id);
                const accounts = yield* deviceB.$client.unsafe<{ readonly instrumentId: number; readonly balance: number }>(
                    'SELECT a.instrument_id AS instrumentId, b.amount AS balance FROM accounts a JOIN account_balances b ON b.account_id = a.id WHERE a.title = ?',
                    ['Apple']
                );
                expect(accounts).toEqual([{ instrumentId: received[0].id, balance: 2_000_000 }]);
                yield* assertStoredBalancesMatchLedger(testDb);
                yield* assertStoredBalancesMatchLedger(deviceB);
            })
        );
        it.effect('preserves existing instrument definitions when multiple accounts reference the same fund code', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const seed = new TestSeedService(testDb);
                yield* resetTestDb(deviceB);
                const [instrument] = yield* testDb
                    .insert(InstrumentEntityTable)
                    .values({
                        code: 'INZHUR:TEST',
                        name: 'Sender fund',
                        symbol: 'FUND',
                        type: InstrumentTypeEnum.FUND,
                        priceProvider: InstrumentPriceProviderEnum.INZHUR,
                        providerInstrumentId: 'INZHUR:TEST'
                    })
                    .returning();
                const [existing] = yield* deviceB
                    .insert(InstrumentEntityTable)
                    .values({
                        code: instrument.code,
                        name: 'Existing fund',
                        symbol: 'LOCAL',
                        type: InstrumentTypeEnum.FUND
                    })
                    .returning();
                yield* seed.account({ title: 'First fund', type: AccountTypeEnum.STOCKS, instrumentId: instrument.id });
                yield* seed.account({ title: 'Second fund', type: AccountTypeEnum.STOCKS, instrumentId: instrument.id });
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);
                expect(yield* deviceB.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, instrument.code))).toEqual([
                    existing
                ]);
                const accounts = yield* deviceB.$client.unsafe<{ readonly instrumentId: number }>(
                    'SELECT instrument_id AS instrumentId FROM accounts ORDER BY id'
                );
                expect(accounts).toEqual([{ instrumentId: existing.id }, { instrumentId: existing.id }]);
                yield* assertStoredBalancesMatchLedger(deviceB);
            })
        );
    });
});
