import { TestSeedService } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { refreshAllBalances } from './apply-harness';
import {
    HOUSEHOLD_ZONE,
    PERSONAL_ZONE,
    countRows,
    onShareDevice,
    pullZones,
    queryRows,
    reconcileDevice,
    uploadDevice
} from './share-harness';
import {
    shareDevices,
    expectLedgers,
    expectNoRejections,
    expectTitleZones,
    pullHousehold,
    shareAndUpload,
    startHousehold
} from './share-tests-shared';

import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const OWNER_DEVICE = 'owner-device';
const MEMBER_DEVICE = 'member-device';
const GROCERIES_ID = 11;
const JOINT_AND_WALLET = [
    ['Joint', HOUSEHOLD_ZONE],
    ['Wallet', PERSONAL_ZONE]
] as const;
const SHARED_TRANSACTIONS = [
    ['Dinner', HOUSEHOLD_ZONE],
    ['Lunch', HOUSEHOLD_ZONE]
] as const;

const unshareAccount = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.unshareAccount(accountId))
    );

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

const startJointShare = (memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        const { deviceB, clouds } = yield* startHousehold(memberRole);
        const { joint } = yield* seedJointHistory;

        yield* uploadDevice(testDb, clouds);

        return { deviceB, clouds, joint };
    });

const shareWithOwnerSecondDevice = Effect.gen(function* () {
    const { deviceB, clouds, joint } = yield* startJointShare(SyncZoneRoleEnum.OWNER);

    yield* pullZones(deviceB, clouds.personal, OWNER_DEVICE, [PERSONAL_ZONE]);
    yield* shareAndUpload(testDb, clouds, joint.id);

    return { deviceB, clouds };
});

describe('cloud-sync/share-accounts', () => {
    shareDevices('two devices', it => {
        it.effect('moves an account with its history to the household and the member receives only the shared data', () =>
            Effect.gen(function* () {
                const { deviceB, clouds, joint } = yield* startJointShare(SyncZoneRoleEnum.PARTICIPANT);

                yield* shareAndUpload(testDb, clouds, joint.id);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
                yield* expectTitleZones(deviceB, 'accounts', [['Joint', HOUSEHOLD_ZONE]]);
                yield* expectTitleZones(deviceB, 'transactions', SHARED_TRANSACTIONS);
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

                yield* expectTitleZones(testDb, 'accounts', JOINT_AND_WALLET);
                yield* expectTitleZones(testDb, 'transactions', [...SHARED_TRANSACTIONS, ['Private snack', PERSONAL_ZONE]]);
                expect(yield* countRows(testDb, `categories WHERE title = 'Pizza night'`)).toBe(2);
                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                expect(
                    yield* onShareDevice(
                        testDb,
                        Effect.flatMap(HouseholdShareService, service => service.findSharedAccountIds)
                    )
                ).toEqual([joint.id]);
                yield* expectLedgers(testDb, deviceB);
            })
        );

        it.effect('moves the account back on unshare and removes the shared data from the member', () =>
            Effect.gen(function* () {
                const { deviceB, clouds, joint } = yield* startJointShare(SyncZoneRoleEnum.PARTICIPANT);

                yield* shareAndUpload(testDb, clouds, joint.id);
                yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE);
                yield* unshareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, clouds);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
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
                yield* expectLedgers(testDb, deviceB);
            })
        );

        it.effect.each(['upload', 'reverse', 'shuffled'] as const)(
            'converges on the owner second device when the move is delivered in %s order, split and duplicated',
            order =>
                Effect.gen(function* () {
                    const { deviceB, clouds } = yield* shareWithOwnerSecondDevice;
                    const delivery = { order, chunkSize: 2, isDuplicated: true };
                    const results = [
                        ...(yield* pullZones(deviceB, clouds.personal, 'owner-b-personal', [PERSONAL_ZONE], delivery)),
                        ...(yield* pullHousehold(deviceB, clouds, 'owner-b-household', delivery)),
                        ...(yield* pullZones(deviceB, clouds.personal, OWNER_DEVICE, [PERSONAL_ZONE], delivery))
                    ];

                    yield* reconcileDevice(deviceB);

                    expectNoRejections(results);
                    yield* expectTitleZones(deviceB, 'accounts', JOINT_AND_WALLET);
                    yield* expectTitleZones(deviceB, 'transactions', [...SHARED_TRANSACTIONS, ['Private snack', PERSONAL_ZONE]]);
                    expect(yield* countRows(deviceB, `transaction_entries`)).toBe(3);
                    expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);
                    yield* expectLedgers(testDb, deviceB);
                })
        );

        it.effect('covers accounts added after Share everything is switched on', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);

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

                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
                yield* expectTitleZones(deviceB, 'accounts', [
                    ['Fresh', HOUSEHOLD_ZONE],
                    ['Joint', HOUSEHOLD_ZONE],
                    ['Wallet', HOUSEHOLD_ZONE]
                ]);
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_ZONE}'`)).toBe(4);
                expect(yield* countRows(testDb, `settings WHERE household_share_everything = 1`)).toBe(1);
                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                yield* expectLedgers(testDb, deviceB);
            })
        );

        it.effect('keeps a transaction created on the owner second device while the account was being shared', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* shareWithOwnerSecondDevice;
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
                    yield* pullHousehold(testDb, clouds, `owner-a-${round}`);
                    yield* reconcileDevice(testDb);
                    yield* uploadDevice(testDb, clouds);
                    yield* pullZones(deviceB, clouds.personal, `owner-b-${round}`, [PERSONAL_ZONE]);
                    yield* pullHousehold(deviceB, clouds, `owner-b-${round}`);
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
                    yield* expectTitleZones(database, 'accounts', JOINT_AND_WALLET);
                    yield* expectLedgers(database);
                }
            })
        );
    });
});
