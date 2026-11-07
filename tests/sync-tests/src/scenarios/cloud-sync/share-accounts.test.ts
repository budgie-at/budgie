import { FakeCloudTransport, TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { Db, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { expectBalancesMatchLedger, refreshAllBalances } from './apply-harness';
import {
    HOUSEHOLD_ZONE,
    PERSONAL_ZONE,
    countRows,
    onShareDevice,
    prepareHousehold,
    pullZones,
    reconcileDevice,
    queryRows,
    uploadDevice
} from './share-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const OWNER_DEVICE = 'owner-device';
const MEMBER_DEVICE = 'member-device';
const GROCERIES_ID = 11;

const makeClouds = (): ShareCloudsInterface => ({ personal: new FakeCloudTransport(), household: new FakeCloudTransport() });

const shareAccount = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.shareAccount(accountId))
    );

const unshareAccount = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.unshareAccount(accountId))
    );

const expectBothLedgers = (...databases: readonly DB[]) =>
    Effect.forEach(databases, database => expectBalancesMatchLedger(database), { discard: true });

const seedJointHistory = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });
    const wallet = yield* seed.account({ title: 'Wallet' });
    const pizza = yield* seed.category('Pizza night');
    const trip = yield* seed.tag('trip');
    const lunch = yield* seed.manualExpense({
        accountId: joint.id,
        amount: 5_000_000,
        operatedAt: OPERATED_AT,
        title: 'Lunch',
        categoryId: GROCERIES_ID
    });
    const dinner = yield* seed.manualExpense({
        accountId: joint.id,
        amount: 7_000_000,
        operatedAt: OPERATED_AT,
        title: 'Dinner',
        categoryId: pizza.id
    });

    yield* seed.transactionTag(dinner.id, trip.id);

    const snack = yield* seed.manualExpense({
        accountId: wallet.id,
        amount: 1_000_000,
        operatedAt: OPERATED_AT,
        title: 'Private snack',
        categoryId: pizza.id
    });

    yield* refreshAllBalances(testDb);

    return { joint, wallet, pizza, trip, lunch, dinner, snack };
});

describe('cloud-sync/share-accounts', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('moves an account with its history to the household and the member receives only the shared data', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const { joint } = yield* seedJointHistory;

                yield* uploadDevice(testDb, clouds);
                yield* shareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, clouds);

                const results = yield* pullZones(deviceB, clouds.household, MEMBER_DEVICE, [HOUSEHOLD_ZONE]);

                expect(results.flatMap(result => result.rejected)).toEqual([]);
                expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM accounts ORDER BY title`)).toEqual([
                    { title: 'Joint', sync_zone: HOUSEHOLD_ZONE }
                ]);
                expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM transactions ORDER BY title`)).toEqual([
                    { title: 'Dinner', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Lunch', sync_zone: HOUSEHOLD_ZONE }
                ]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT t.title AS title, c.title AS category, c.sync_zone AS categoryZone FROM transaction_entries e
                        INNER JOIN transactions t ON t.id = e.transaction_id INNER JOIN categories c ON c.id = e.category_id ORDER BY t.title`
                    )
                ).toEqual([
                    { title: 'Dinner', category: 'Pizza night', categoryZone: HOUSEHOLD_ZONE },
                    { title: 'Lunch', category: 'Groceries', categoryZone: HOUSEHOLD_ZONE }
                ]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT g.title AS title, g.sync_zone AS zone FROM transaction_tags tt INNER JOIN tags g ON g.id = tt.tag_id`
                    )
                ).toEqual([{ title: 'trip', zone: HOUSEHOLD_ZONE }]);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Groceries'`)).toBe(2);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Pizza night'`)).toBe(1);
                expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);

                expect(yield* queryRows(testDb, `SELECT title, sync_zone FROM accounts ORDER BY title`)).toEqual([
                    { title: 'Joint', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Wallet', sync_zone: PERSONAL_ZONE }
                ]);
                expect(yield* queryRows(testDb, `SELECT title, sync_zone FROM transactions ORDER BY title`)).toEqual([
                    { title: 'Dinner', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Lunch', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Private snack', sync_zone: PERSONAL_ZONE }
                ]);
                expect(yield* countRows(testDb, `categories WHERE title = 'Pizza night'`)).toBe(2);
                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                expect(
                    yield* onShareDevice(
                        testDb,
                        Effect.flatMap(HouseholdShareService, service => service.findSharedAccountIds)
                    )
                ).toEqual([joint.id]);
                yield* expectBothLedgers(testDb, deviceB);
            })
        );

        it.effect('moves the account back on unshare and removes the shared data from the member', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const { joint } = yield* seedJointHistory;

                yield* uploadDevice(testDb, clouds);
                yield* shareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, MEMBER_DEVICE, [HOUSEHOLD_ZONE]);
                yield* unshareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, clouds);

                const results = yield* pullZones(deviceB, clouds.household, MEMBER_DEVICE, [HOUSEHOLD_ZONE]);

                expect(results.flatMap(result => result.rejected)).toEqual([]);
                expect(yield* countRows(deviceB, `accounts`)).toBe(0);
                expect(yield* countRows(deviceB, `transactions`)).toBe(0);
                expect(yield* countRows(deviceB, `transaction_entries`)).toBe(0);
                expect(yield* countRows(testDb, `accounts WHERE sync_zone = '${PERSONAL_ZONE}'`)).toBe(2);
                expect(yield* countRows(testDb, `transactions WHERE sync_zone = '${PERSONAL_ZONE}'`)).toBe(3);
                expect(yield* countRows(testDb, `transaction_entries WHERE sync_zone <> '${PERSONAL_ZONE}'`)).toBe(0);
                expect(
                    yield* countRows(
                        testDb,
                        `transaction_tags tt INNER JOIN tags g ON g.id = tt.tag_id WHERE g.sync_zone <> '${PERSONAL_ZONE}'`
                    )
                ).toBe(0);
                expect(
                    yield* countRows(
                        testDb,
                        `transaction_entries e INNER JOIN categories c ON c.id = e.category_id INNER JOIN accounts a ON a.id = e.account_id WHERE c.sync_zone <> a.sync_zone`
                    )
                ).toBe(0);
                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                yield* expectBothLedgers(testDb, deviceB);
            })
        );

        for (const order of ['upload', 'reverse', 'shuffled'] as const) {
            it.effect(`converges on the owner second device when the move is delivered in ${order} order, split and duplicated`, () =>
                Effect.gen(function* () {
                    const deviceB = yield* Db;
                    const clouds = makeClouds();

                    yield* prepareHousehold(deviceB, SyncZoneRoleEnum.OWNER);

                    const { joint } = yield* seedJointHistory;

                    yield* uploadDevice(testDb, clouds);
                    yield* pullZones(deviceB, clouds.personal, OWNER_DEVICE, [PERSONAL_ZONE]);
                    yield* shareAccount(testDb, joint.id);
                    yield* uploadDevice(testDb, clouds);

                    const delivery = { order, chunkSize: 2, isDuplicated: true };
                    const results = [
                        ...(yield* pullZones(deviceB, clouds.personal, 'owner-b-personal', [PERSONAL_ZONE], delivery)),
                        ...(yield* pullZones(deviceB, clouds.household, 'owner-b-household', [HOUSEHOLD_ZONE], delivery)),
                        ...(yield* pullZones(deviceB, clouds.personal, OWNER_DEVICE, [PERSONAL_ZONE], delivery))
                    ];

                    yield* reconcileDevice(deviceB);

                    expect(results.flatMap(result => result.rejected)).toEqual([]);
                    expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM accounts ORDER BY title`)).toEqual([
                        { title: 'Joint', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Wallet', sync_zone: PERSONAL_ZONE }
                    ]);
                    expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM transactions ORDER BY title`)).toEqual([
                        { title: 'Dinner', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Lunch', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Private snack', sync_zone: PERSONAL_ZONE }
                    ]);
                    expect(yield* countRows(deviceB, `transaction_entries`)).toBe(3);
                    expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);
                    yield* expectBothLedgers(testDb, deviceB);
                })
            );
        }

        it.effect('covers accounts added after Share everything is switched on', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);
                yield* seedJointHistory;
                yield* uploadDevice(testDb, clouds);
                yield* onShareDevice(
                    testDb,
                    Effect.flatMap(HouseholdShareService, service => service.setShareEverything(true))
                );

                const fresh = yield* new TestSeedService(testDb).account({ title: 'Fresh' });

                yield* new TestSeedService(testDb).manualExpense({
                    accountId: fresh.id,
                    amount: 3_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Fresh spend'
                });
                yield* refreshAllBalances(testDb);
                yield* reconcileDevice(testDb);
                yield* uploadDevice(testDb, clouds);

                const results = yield* pullZones(deviceB, clouds.household, MEMBER_DEVICE, [HOUSEHOLD_ZONE]);

                expect(results.flatMap(result => result.rejected)).toEqual([]);
                expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM accounts ORDER BY title`)).toEqual([
                    { title: 'Fresh', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Joint', sync_zone: HOUSEHOLD_ZONE },
                    { title: 'Wallet', sync_zone: HOUSEHOLD_ZONE }
                ]);
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_ZONE}'`)).toBe(4);
                expect(yield* countRows(testDb, `settings WHERE household_share_everything = 1`)).toBe(1);
                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                yield* expectBothLedgers(testDb, deviceB);
            })
        );

        it.effect('keeps a transaction created on the owner second device while the account was being shared', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.OWNER);

                const { joint } = yield* seedJointHistory;

                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.personal, OWNER_DEVICE, [PERSONAL_ZONE]);
                yield* shareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, clouds);

                const [secondDeviceJoint] = yield* queryRows<{ readonly id: number }>(
                    deviceB,
                    `SELECT id FROM accounts WHERE title = 'Joint'`
                );

                yield* new TestSeedService(deviceB).manualExpense({
                    accountId: secondDeviceJoint.id,
                    amount: 2_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Late lunch'
                });
                yield* refreshAllBalances(deviceB);
                yield* uploadDevice(deviceB, clouds);

                for (const round of [1, 2]) {
                    yield* pullZones(testDb, clouds.personal, `owner-a-${round}`, [PERSONAL_ZONE]);
                    yield* pullZones(testDb, clouds.household, `owner-a-${round}`, [HOUSEHOLD_ZONE]);
                    yield* reconcileDevice(testDb);
                    yield* uploadDevice(testDb, clouds);
                    yield* pullZones(deviceB, clouds.personal, `owner-b-${round}`, [PERSONAL_ZONE]);
                    yield* pullZones(deviceB, clouds.household, `owner-b-${round}`, [HOUSEHOLD_ZONE]);
                    yield* reconcileDevice(deviceB);
                    yield* uploadDevice(deviceB, clouds);
                }

                for (const database of [testDb, deviceB]) {
                    expect(
                        yield* queryRows(
                            database,
                            `SELECT title, sync_zone FROM transactions WHERE title <> 'Private snack' ORDER BY title`
                        )
                    ).toEqual([
                        { title: 'Dinner', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Late lunch', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Lunch', sync_zone: HOUSEHOLD_ZONE }
                    ]);
                    expect(
                        yield* countRows(
                            database,
                            `transaction_entries WHERE account_id IN (SELECT id FROM accounts WHERE title = 'Joint') AND sync_zone <> '${HOUSEHOLD_ZONE}'`
                        )
                    ).toBe(0);
                    expect(yield* countRows(database, `transactions WHERE title = 'Late lunch'`)).toBe(1);
                    expect(yield* queryRows(database, `SELECT title, sync_zone FROM accounts ORDER BY title`)).toEqual([
                        { title: 'Joint', sync_zone: HOUSEHOLD_ZONE },
                        { title: 'Wallet', sync_zone: PERSONAL_ZONE }
                    ]);
                    yield* expectBalancesMatchLedger(database);
                }
            })
        );
    });
});
