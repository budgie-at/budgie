import { TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { HouseholdMembershipService, HouseholdShareService } from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport, testDb } from '../../harness';

import { refreshAllBalances } from './apply-harness';
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
import { makeSyncServiceContext } from './sync-service-harness';

import type { ShareCloudsInterface } from './share-harness';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const GROCERIES_ID = 11;

describe('cloud-sync/household leave categories', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member leaves', it => {
        it.effect('merges household seeded categories into the personal ones and keeps user categories once', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: new FakeCloudTransport() };

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const seed = new TestSeedService(testDb);
                const joint = yield* seed.account({ title: 'Joint' });
                const pizza = yield* seed.category('Pizza night');

                yield* seed.manualExpense({
                    accountId: joint.id,
                    amount: 5_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Lunch',
                    categoryId: GROCERIES_ID
                });
                yield* seed.manualExpense({
                    accountId: joint.id,
                    amount: 7_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Dinner',
                    categoryId: pizza.id
                });
                yield* refreshAllBalances(testDb);
                yield* uploadDevice(testDb, clouds);
                yield* onShareDevice(
                    testDb,
                    Effect.flatMap(HouseholdShareService, service => service.shareAccount(joint.id))
                );
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);

                expect(yield* countRows(deviceB, `categories WHERE sync_zone = '${HOUSEHOLD_SYNC_ZONE}'`)).toBeGreaterThan(1);

                const personalBefore = yield* countRows(deviceB, `categories WHERE sync_zone = '${PERSONAL_ZONE}'`);

                yield* makeSyncServiceContext(deviceB).run(
                    Effect.flatMap(HouseholdMembershipService, service => service.keepPersonalCopy())
                );

                expect(yield* countRows(deviceB, `categories WHERE sync_zone <> '${PERSONAL_ZONE}'`)).toBe(0);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Groceries'`)).toBe(1);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Pizza night'`)).toBe(1);
                expect(yield* countRows(deviceB, `categories WHERE sync_zone = '${PERSONAL_ZONE}'`)).toBe(personalBefore + 1);

                const entries = yield* queryRows<{ readonly title: string; readonly zone: string }>(
                    deviceB,
                    `SELECT c.title AS title, c.sync_zone AS zone FROM transaction_entries e INNER JOIN categories c ON c.id = e.category_id ORDER BY c.title`
                );

                expect(entries.map(({ title }) => title)).toEqual(['Groceries', 'Pizza night']);
                expect(entries.every(({ zone }) => zone === PERSONAL_ZONE)).toBe(true);

                const [groceries] = yield* queryRows<{ readonly id: number }>(
                    deviceB,
                    `SELECT id FROM categories WHERE title = 'Groceries'`
                );

                expect(groceries.id).toBe(GROCERIES_ID);
            })
        );
    });
});
