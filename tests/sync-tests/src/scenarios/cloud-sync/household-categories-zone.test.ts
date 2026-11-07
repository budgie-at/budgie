import { FakeCloudTransport, TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { CategoryRepository, Db, HOUSEHOLD_SYNC_ZONE, LanguageEnum, PERSONAL_SYNC_ZONE, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { refreshAllBalances } from './apply-harness';
import { HOUSEHOLD_ZONE, onShareDevice, prepareHousehold, pullZones, uploadDevice } from './share-harness';

import type { ShareCloudsInterface } from './share-harness';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const GROCERIES_ID = 11;

const hasDuplicates = (titles: readonly string[]): boolean => new Set(titles).size !== titles.length;

describe('cloud-sync/household categories by zone', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member with a household', it => {
        it.effect('lists every category once per zone and keeps the zones apart', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds: ShareCloudsInterface = { personal: new FakeCloudTransport(), household: new FakeCloudTransport() };

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

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
                yield* uploadDevice(testDb, clouds);
                yield* onShareDevice(
                    testDb,
                    Effect.flatMap(HouseholdShareService, service => service.shareAccount(joint.id))
                );
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);

                const { personal, household, personalNonSystem, householdNonSystem } = yield* Effect.gen(function* () {
                    const categoryRepository = yield* CategoryRepository;

                    return {
                        personal: yield* categoryRepository.findBySearchQuery('', true, LanguageEnum.EN, PERSONAL_SYNC_ZONE),
                        household: yield* categoryRepository.findBySearchQuery('', true, LanguageEnum.EN, HOUSEHOLD_SYNC_ZONE),
                        personalNonSystem: yield* categoryRepository.findAllNonSystemLocalized(LanguageEnum.EN, PERSONAL_SYNC_ZONE),
                        householdNonSystem: yield* categoryRepository.findAllNonSystemLocalized(LanguageEnum.EN, HOUSEHOLD_SYNC_ZONE)
                    };
                }).pipe(Effect.provide(CategoryRepository.layer));

                expect(personal.length).toBeGreaterThan(1);
                expect(household.length).toBeGreaterThan(0);
                expect(personal.every(({ syncZone }) => syncZone === PERSONAL_SYNC_ZONE)).toBe(true);
                expect(household.every(({ syncZone }) => syncZone === HOUSEHOLD_SYNC_ZONE)).toBe(true);
                expect(personalNonSystem.every(({ syncZone }) => syncZone === PERSONAL_SYNC_ZONE)).toBe(true);
                expect(householdNonSystem.every(({ syncZone }) => syncZone === HOUSEHOLD_SYNC_ZONE)).toBe(true);
                expect(hasDuplicates(personal.map(({ title }) => title))).toBe(false);
                expect(hasDuplicates(household.map(({ title }) => title))).toBe(false);
                expect(household.some(({ title }) => title === 'Groceries')).toBe(true);
            })
        );
    });
});
