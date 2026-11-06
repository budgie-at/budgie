import { TestSeedService, FakeCloudTransport, makeTestDbLayer, resetTestDb } from '@budgie-at/test-kit';
import { Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { expectBalancesMatchLedger, pullDevice, pushDevice, readOutboxRows, refreshAllBalances, stateSnapshot } from './apply-harness';

import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const DEVICE_B = 'device-b';

const seedExpense = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const account = yield* seed.account({ title: 'Cash' });
    const transaction = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });

    yield* refreshAllBalances(testDb);

    return { account, transaction };
});

const countRows = (database: DB, tableName: string) =>
    database.$client
        .unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM ${tableName}`)
        .pipe(Effect.map(([row]) => row.total));

const withoutZone = (rows: readonly Record<string, unknown>[]) =>
    rows
        .map(row => Object.fromEntries(Object.entries(row).filter(([column]) => column !== 'sync_zone')))
        .sort((left, right) => `${left['sync_id']}`.localeCompare(`${right['sync_id']}`));

const expectSameLedger = (deviceB: DB) =>
    Effect.gen(function* () {
        const left = yield* stateSnapshot(testDb);
        const right = yield* stateSnapshot(deviceB);

        expect(right['transactions']).toEqual(left['transactions']);
        expect(withoutZone(right['transaction_entries'])).toEqual(withoutZone(left['transaction_entries']));
        expect(right['accounts']).toEqual(left['accounts']);
        yield* expectBalancesMatchLedger(deviceB);
        yield* expectBalancesMatchLedger(testDb);
    });

describe('cloud-sync/apply-delivery', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('applies a transfer created on one device with both legs on the other', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const seed = new TestSeedService(testDb);

                yield* resetTestDb(deviceB);

                const source = yield* seed.account({ title: 'Cash' });
                const target = yield* seed.account({ title: 'Card' });

                yield* seed.directTransfer({
                    exchangeRate: 1,
                    operatedAt: OPERATED_AT,
                    sourceAccountId: source.id,
                    sourceAmount: 3_000_000,
                    sourceEntryExchangeRate: 1,
                    targetAccountId: target.id,
                    targetAmount: 3_000_000,
                    title: 'Move',
                    toIban: null
                });
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);

                const results = yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(results[0].touched['Transaction']).toHaveLength(1);
                expect(yield* countRows(deviceB, 'transaction_entries')).toBe(2);
                yield* expectSameLedger(deviceB);
            })
        );

        it.effect('holds a child record until its parent arrives, whatever the delivery order', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);
                yield* seedExpense;
                yield* pushDevice(testDb, cloud);

                const results = yield* pullDevice(deviceB, cloud, DEVICE_B, { order: 'reverse', chunkSize: 1 });
                const heldAtFirst = results[0].heldBack;
                const last = results[results.length - 1];

                expect(heldAtFirst).toBeGreaterThan(0);
                expect(last.heldBack).toBe(0);
                expect(yield* countRows(deviceB, 'sync_pending')).toBe(0);
                expect(yield* countRows(deviceB, 'transaction_entries')).toBe(1);
                yield* expectSameLedger(deviceB);
            })
        );

        it.effect('applies a replayed and duplicated batch once', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);
                yield* seedExpense;
                yield* pushDevice(testDb, cloud);

                const results = yield* pullDevice(deviceB, cloud, DEVICE_B, { isDuplicated: true, order: 'shuffled', chunkSize: 2 });
                const half = results.length / 2;
                const replayed = results.slice(half);

                expect(replayed.every(result => result.skipped > 0 || Object.keys(result.touched).length === 0)).toBe(true);
                expect(replayed.flatMap(result => Object.values(result.touchedRows)).flat()).toEqual([]);
                expect(yield* countRows(deviceB, 'transactions')).toBe(1);
                expect(yield* countRows(deviceB, 'transaction_entries')).toBe(1);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
                yield* expectSameLedger(deviceB);
            })
        );

        it.effect('joins a split transfer on the owner device even when the halves arrive apart', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const seed = new TestSeedService(testDb);

                yield* resetTestDb(deviceB);

                const personal = yield* seed.account({ title: 'Personal' });
                const household = yield* seed.account({ title: 'Household' });

                yield* testDb.$client.unsafe(`UPDATE accounts SET sync_zone = 'household' WHERE id = ?`, [household.id]);
                yield* seed.directTransfer({
                    exchangeRate: 1,
                    operatedAt: OPERATED_AT,
                    sourceAccountId: personal.id,
                    sourceAmount: 2_000_000,
                    sourceEntryExchangeRate: 1,
                    targetAccountId: household.id,
                    targetAmount: 2_000_000,
                    title: 'Split',
                    toIban: null
                });
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);

                const results = yield* pullDevice(deviceB, cloud, DEVICE_B, { order: 'reverse', chunkSize: 1 });
                const zones = yield* deviceB.$client.unsafe<{ readonly zone: string }>(
                    `SELECT DISTINCT a.sync_zone AS zone FROM transaction_entries e INNER JOIN accounts a ON a.id = e.account_id ORDER BY zone`
                );

                expect(results.some(result => result.heldBack > 0)).toBe(true);
                expect(results[results.length - 1].heldBack).toBe(0);
                expect(zones.map(({ zone }) => zone)).toEqual(['household', 'personal']);
                expect(yield* countRows(deviceB, 'transactions')).toBe(1);
                expect(yield* countRows(deviceB, 'transaction_entries')).toBe(2);
                yield* expectSameLedger(deviceB);
            })
        );
    });
});
