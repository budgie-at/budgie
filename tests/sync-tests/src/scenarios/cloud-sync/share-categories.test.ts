import { FakeCloudTransport, TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { Db, HouseholdShareService, SyncZoneRoleEnum } from '@budgie/contracts';
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
    queryRows,
    uploadDevice
} from './share-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
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

const shareAccount = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.shareAccount(accountId))
    );

describe('cloud-sync/share-categories', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('keeps the seeded Groceries of owner and member independent', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const ownerClouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: new FakeCloudTransport() };
                const memberClouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: ownerClouds.household };

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const joint = yield* shareGroceriesAccount;

                yield* uploadDevice(testDb, ownerClouds);
                yield* shareAccount(testDb, joint.id);
                yield* uploadDevice(testDb, ownerClouds);
                yield* pullZones(deviceB, ownerClouds.household, 'member', [HOUSEHOLD_ZONE]);

                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_ZONE },
                    { title: 'Groceries', zone: PERSONAL_ZONE }
                ]);

                yield* deviceB.$client.unsafe(`UPDATE categories SET title = 'Food', title_search = 'food' WHERE id = ?`, [GROCERIES_ID]);
                yield* uploadDevice(deviceB, memberClouds);
                yield* pullZones(testDb, ownerClouds.household, 'owner', [HOUSEHOLD_ZONE]);
                yield* pullZones(testDb, ownerClouds.personal, 'owner', [PERSONAL_ZONE]);

                expect(yield* readCategoryTitles(testDb)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_ZONE },
                    { title: 'Groceries', zone: PERSONAL_ZONE }
                ]);
                expect(yield* countRows(testDb, `categories WHERE title = 'Food'`)).toBe(0);
                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Groceries', zone: HOUSEHOLD_ZONE },
                    { title: 'Food', zone: PERSONAL_ZONE }
                ]);
                expect(ownerClouds.household.inventory(HOUSEHOLD_ZONE).size).toBeGreaterThan(0);
                yield* expectBalancesMatchLedger(testDb);
                yield* expectBalancesMatchLedger(deviceB);
            })
        );

        it.effect('keeps a seeded category rename when a new member device joins later', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: new FakeCloudTransport() };

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);
                yield* testDb.$client.unsafe(`UPDATE categories SET title = 'Supermarket', title_search = 'supermarket' WHERE id = ?`, [
                    GROCERIES_ID
                ]);

                const joint = yield* shareGroceriesAccount;

                yield* shareAccount(testDb, joint.id);
                yield* testDb.$client.unsafe(
                    `UPDATE categories SET title = 'Supermarket XL', title_search = 'supermarket xl' WHERE sync_zone = ? AND sync_id = (SELECT sync_id FROM categories WHERE id = ?)`,
                    [HOUSEHOLD_ZONE, GROCERIES_ID]
                );
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'new-member', [HOUSEHOLD_ZONE]);

                expect(yield* readCategoryTitles(deviceB)).toEqual([
                    { title: 'Supermarket XL', zone: HOUSEHOLD_ZONE },
                    { title: 'Groceries', zone: PERSONAL_ZONE }
                ]);
                expect(yield* readCategoryTitles(testDb)).toEqual([
                    { title: 'Supermarket XL', zone: HOUSEHOLD_ZONE },
                    { title: 'Supermarket', zone: PERSONAL_ZONE }
                ]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT c.title AS title FROM transaction_entries e INNER JOIN categories c ON c.id = e.category_id`
                    )
                ).toEqual([{ title: 'Supermarket XL' }]);
                yield* expectBalancesMatchLedger(deviceB);
            })
        );
    });
});
