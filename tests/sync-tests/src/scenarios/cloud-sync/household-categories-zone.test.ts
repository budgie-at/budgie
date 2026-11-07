import { makeTestDbLayer } from '@budgie-at/test-kit';
import { CategoryRepository, Db, HOUSEHOLD_SYNC_ZONE, LanguageEnum, PERSONAL_SYNC_ZONE, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { makeShareClouds, deliverHouseholdToMember, seedGroceriesJoint, prepareHousehold } from '../../harness';

const hasDuplicates = (titles: readonly string[]): boolean => new Set(titles).size !== titles.length;

describe('cloud-sync/household categories by zone', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member with a household', it => {
        it.effect('lists every category once per zone and keeps the zones apart', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeShareClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const joint = yield* seedGroceriesJoint;

                yield* deliverHouseholdToMember(deviceB, clouds, joint.id);

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
