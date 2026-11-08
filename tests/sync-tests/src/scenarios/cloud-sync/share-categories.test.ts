import { TestSeedService } from '@budgie-at/test-kit';
import { HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    FakeCloudTransport,
    testDb,
    refreshAllBalances,
    uploadDevice,
    OPERATED_AT,
    countRows,
    pullZones,
    queryRows,
    shareDevices,
    expectLedgers,
    pullHousehold,
    shareAccount,
    startHousehold
} from '../../harness';

import type { ShareCloudsInterface } from '../../harness';
import type { DB } from '@budgie/contracts';

const GROCERIES_ID = 11;

const readCategoryTitles = (database: DB) =>
    queryRows<{ readonly title: string; readonly zone: string }>(
        database,
        `SELECT title, sync_zone AS zone FROM categories WHERE sync_id = (SELECT sync_id FROM categories WHERE id = ${GROCERIES_ID}) ORDER BY sync_zone`
    );

const shareGroceriesAccount = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });

    yield* seed.manualExpense({
        accountId: joint.id,
        amount: 5_000_000,
        operatedAt: OPERATED_AT,
        title: 'Lunch',
        categoryId: GROCERIES_ID
    });
    yield* refreshAllBalances(testDb);

    return joint;
});

describe('cloud-sync/share-categories', () => {
    shareDevices('two devices', it => {
        it.effect('keeps the seeded Groceries of owner and member independent', () =>
            Effect.gen(function* () {
                const { deviceB, clouds: ownerClouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const memberClouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: ownerClouds.household };

                const joint = yield* shareGroceriesAccount;

                yield* uploadDevice(testDb, ownerClouds);
                yield* shareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, ownerClouds);
                yield* pullHousehold(deviceB, ownerClouds, 'member');

                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_SYNC_ZONE },
                    { title: 'Groceries', zone: PERSONAL_SYNC_ZONE }
                ]);

                yield* deviceB.$client.unsafe(`UPDATE categories SET title = 'Food', title_search = 'food' WHERE id = ?`, [GROCERIES_ID]);
                yield* uploadDevice(deviceB, memberClouds);
                yield* pullHousehold(testDb, ownerClouds, 'owner');
                yield* pullZones(testDb, ownerClouds.personal, 'owner', [PERSONAL_SYNC_ZONE]);

                expect(yield* readCategoryTitles(testDb)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_SYNC_ZONE },
                    { title: 'Groceries', zone: PERSONAL_SYNC_ZONE }
                ]);
                expect(yield* countRows(testDb, `categories WHERE title = 'Food'`)).toBe(0);
                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_SYNC_ZONE },
                    { title: 'Food', zone: PERSONAL_SYNC_ZONE }
                ]);
                expect(ownerClouds.household.inventory(HOUSEHOLD_SYNC_ZONE).size).toBeGreaterThan(0);
                yield* expectLedgers(testDb, deviceB);
            })
        );

        it.effect('keeps a seeded category rename when a new member device joins later', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                yield* testDb.$client.unsafe(`UPDATE categories SET title = 'Supermarket', title_search = 'supermarket' WHERE id = ?`, [
                    GROCERIES_ID
                ]);

                const joint = yield* shareGroceriesAccount;

                yield* shareAccount(testDb, joint.id);
                yield* testDb.$client.unsafe(
                    `UPDATE categories SET title = 'Supermarket XL', title_search = 'supermarket xl' WHERE sync_zone = ? AND sync_id = (SELECT sync_id FROM categories WHERE id = ?)`,
                    [HOUSEHOLD_SYNC_ZONE, GROCERIES_ID]
                );
                yield* uploadDevice(testDb, clouds);
                yield* pullHousehold(deviceB, clouds, 'new-member');

                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Supermarket XL', zone: HOUSEHOLD_SYNC_ZONE },
                    { title: 'Groceries', zone: PERSONAL_SYNC_ZONE }
                ]);
                expect(yield* readCategoryTitles(testDb)).toEqual([
                    { title: 'Supermarket XL', zone: HOUSEHOLD_SYNC_ZONE },
                    { title: 'Supermarket', zone: PERSONAL_SYNC_ZONE }
                ]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT c.title AS title FROM transaction_entries e INNER JOIN categories c ON c.id = e.category_id`
                    )
                ).toEqual([{ title: 'Supermarket XL' }]);
                yield* expectLedgers(deviceB);
            })
        );
    });
});
