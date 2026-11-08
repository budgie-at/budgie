import { TestSeedService, resetTestDb } from '@budgie-at/test-kit';
import { CategorySourceEnum, Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

import { pullDevice, pushDevice, refreshAllBalances } from './apply-harness';
import { OPERATED_AT } from './cloud-fixtures';
import { FakeCloudTransport } from './fake-cloud-transport';

import type { FakeCloudDeliveryOptionsInterface } from './fake-cloud-delivery-options.interface';
import type { DB } from '@budgie/contracts';

export const DEVICE_A = 'device-a';
export const DEVICE_B = 'device-b';

const seedCashExpense = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const account = yield* seed.account({ title: 'Cash' });
    const transaction = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });

    yield* refreshAllBalances(testDb);

    return { account, transaction };
});

export const pushSeededExpense = (deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        yield* resetTestDb(deviceB);

        const seeded = yield* seedCashExpense;

        yield* pushDevice(testDb, cloud);

        return seeded;
    });

export const pullSeededExpense = (options: FakeCloudDeliveryOptionsInterface) =>
    Effect.gen(function* () {
        const deviceB = yield* Db;
        const cloud = new FakeCloudTransport();

        yield* pushSeededExpense(deviceB, cloud);

        return { deviceB, results: yield* pullDevice(deviceB, cloud, DEVICE_B, options) };
    });

export const mergeBothWays = (deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        yield* pullDevice(deviceB, cloud, DEVICE_B);
        yield* pushDevice(deviceB, cloud);
        yield* pullDevice(testDb, cloud, DEVICE_A);
    });

export const categoryIds = (database: DB) =>
    database.$client
        .unsafe<{ readonly id: number }>(`SELECT id FROM categories WHERE is_default = 1 ORDER BY id LIMIT 2`)
        .pipe(Effect.map(rows => rows.map(({ id }) => id)));

export const applyRuleCategory = (transactionId: number) =>
    Effect.gen(function* () {
        const [ruleCategory, userCategory] = yield* categoryIds(testDb);
        const [entry] = yield* testDb.$client.unsafe<{ readonly id: number }>(
            `SELECT id FROM transaction_entries WHERE transaction_id = ?`,
            [transactionId]
        );

        yield* new TestSeedService(testDb).entryCategory(entry.id, ruleCategory, CategorySourceEnum.RULE);

        return userCategory;
    });
