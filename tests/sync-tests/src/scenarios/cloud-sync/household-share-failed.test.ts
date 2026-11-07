import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { householdJoinAtom } from '@app/household/constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum, ICloudShareOutcome } from '@budgie/cloud-sync';
import { HOUSEHOLD_SYNC_ZONE, SyncZoneRegistryRepository } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import Toast from '../../../../test-kit/src/vitest/toast-message.shim';

import { HOUSEHOLD_CLOUD_ZONE, OWNER_RECORD_NAME } from './household-harness';
import { makeSyncServiceContext, syncService } from './sync-service-harness';

describe('cloud-sync/household share failed', () => {
    it.effect('tells the user when accepting a family invitation fails', () => {
        const show = vi.spyOn(Toast, 'show').mockImplementation(() => undefined);
        const context = makeSyncServiceContext();

        return context
            .run(
                Effect.gen(function* () {
                    const service = yield* syncService;

                    yield* service.handleShareAccepted({
                        zoneName: HOUSEHOLD_CLOUD_ZONE,
                        ownerName: OWNER_RECORD_NAME,
                        outcome: ICloudShareOutcome.FAILED
                    });

                    expect(show).toHaveBeenCalledTimes(1);
                    expect(show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text1: 'Could not join the family' }));
                })
            )
            .pipe(Effect.ensuring(Effect.sync(() => void show.mockRestore())));
    });

    it.effect('shows a joining state without registering the household zone', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* syncService;
                const registry = yield* SyncZoneRegistryRepository;

                yield* service.handleShareAccepted({
                    zoneName: HOUSEHOLD_CLOUD_ZONE,
                    ownerName: OWNER_RECORD_NAME,
                    outcome: ICloudShareOutcome.JOINING,
                    ownerDisplayName: 'Owner Person'
                });

                expect(appAtomRegistry.get(householdJoinAtom)).toEqual({
                    status: HouseholdJoinStatusEnum.JOINING,
                    ownerDisplayName: 'Owner Person'
                });
                expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeFalsy();
            })
        );
    });
});
