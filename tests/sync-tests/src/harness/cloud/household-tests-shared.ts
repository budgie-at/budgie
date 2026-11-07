import { TestSeedService } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncZoneRegistryRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

import { refreshAllBalances, uploadDevice } from './apply-harness';
import { OPERATED_AT } from './cloud-fixtures';
import { shareAcceptedEvent } from './household-harness';
import { HOUSEHOLD_ZONE, onShareDevice, pullZones } from './share-harness';
import { syncService } from './sync-service-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { makeSyncServiceContext } from './sync-service-harness';
import type { DB } from '@budgie/contracts';

export const GROCERIES_ID = 11;

const seedGroceriesLunch = (accountId: number) =>
    new TestSeedService(testDb).manualExpense({
        accountId,
        amount: 5_000_000,
        operatedAt: OPERATED_AT,
        title: 'Lunch',
        categoryId: GROCERIES_ID
    });

export const seedGroceriesJoint = Effect.gen(function* () {
    const joint = yield* new TestSeedService(testDb).account({ title: 'Joint' });

    yield* seedGroceriesLunch(joint.id);
    yield* refreshAllBalances(testDb);

    return joint;
});

export const deliverHouseholdToMember = (memberDb: DB, clouds: ShareCloudsInterface, accountId: number) =>
    Effect.gen(function* () {
        yield* uploadDevice(testDb, clouds);
        yield* onShareDevice(
            testDb,
            Effect.flatMap(HouseholdShareService, service => service.shareAccount(accountId))
        );
        yield* uploadDevice(testDb, clouds);
        yield* pullZones(memberDb, clouds.household, 'member', [HOUSEHOLD_ZONE]);
    });

export const discoverHouseholdEntry = (device: ReturnType<typeof makeSyncServiceContext>) =>
    device.run(
        Effect.gen(function* () {
            const service = yield* syncService;
            const registry = yield* SyncZoneRegistryRepository;

            yield* service.discoverHousehold;

            return yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE);
        })
    );

export const acceptShareThen = <E>(
    member: ReturnType<typeof makeSyncServiceContext>,
    afterAccept: Effect.Effect<unknown, E, Effect.Services<typeof syncService> | Db>
) =>
    member.run(
        Effect.gen(function* () {
            const service = yield* syncService;
            const registry = yield* SyncZoneRegistryRepository;

            yield* service.reconfigure;
            yield* service.handleShareAccepted(shareAcceptedEvent());
            yield* afterAccept;

            return yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE);
        })
    );
