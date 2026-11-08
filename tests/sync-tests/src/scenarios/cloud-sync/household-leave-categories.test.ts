import { TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { HouseholdMembershipService } from '@budgie/cloud-sync';
import { PERSONAL_SYNC_ZONE, Db, HOUSEHOLD_SYNC_ZONE, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    testDb,
    refreshAllBalances,
    makeShareClouds,
    deliverHouseholdToMember,
    GROCERIES_ID,
    seedGroceriesJoint,
    countRows,
    prepareHousehold,
    queryRows,
    makeSyncServiceContext
} from '../../harness';

describe('cloud-sync/household leave categories', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member leaves', it => {
        it.effect('merges household seeded categories into the personal ones and keeps user categories once', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeShareClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const seed = new TestSeedService(testDb);
                const joint = yield* seedGroceriesJoint;
                const pizza = yield* seed.category('Pizza night');

                yield* seed.manualExpense({
                    accountId: joint.id,
                    amount: 7_000_000,
                    operatedAt: new Date('2026-10-02T10:00:00Z'),
                    title: 'Dinner',
                    categoryId: pizza.id
                });
                yield* refreshAllBalances(testDb);
                yield* deliverHouseholdToMember(deviceB, clouds, joint.id);

                expect(yield* countRows(deviceB, `categories WHERE sync_zone = '${HOUSEHOLD_SYNC_ZONE}'`)).toBeGreaterThan(1);

                const personalBefore = yield* countRows(deviceB, `categories WHERE sync_zone = '${PERSONAL_SYNC_ZONE}'`);

                yield* makeSyncServiceContext(deviceB).run(
                    Effect.flatMap(HouseholdMembershipService, service => service.keepPersonalCopy())
                );

                expect(yield* countRows(deviceB, `categories WHERE sync_zone <> '${PERSONAL_SYNC_ZONE}'`)).toBe(0);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Groceries'`)).toBe(1);
                expect(yield* countRows(deviceB, `categories WHERE title = 'Pizza night'`)).toBe(1);
                expect(yield* countRows(deviceB, `categories WHERE sync_zone = '${PERSONAL_SYNC_ZONE}'`)).toBe(personalBefore + 1);

                const entries = yield* queryRows<{ readonly title: string; readonly zone: string }>(
                    deviceB,
                    `SELECT c.title AS title, c.sync_zone AS zone FROM transaction_entries e INNER JOIN categories c ON c.id = e.category_id ORDER BY c.title`
                );

                expect(entries.map(({ title }) => title)).toEqual(['Groceries', 'Pizza night']);
                expect(entries.every(({ zone }) => zone === PERSONAL_SYNC_ZONE)).toBe(true);

                const [groceries] = yield* queryRows<{ readonly id: number }>(
                    deviceB,
                    `SELECT id FROM categories WHERE title = 'Groceries'`
                );

                expect(groceries.id).toBe(GROCERIES_ID);
            })
        );
    });
});
