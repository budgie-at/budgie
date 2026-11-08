import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { householdJoinAtom } from '@app/household/constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum, ICloudShareOutcome } from '@budgie/cloud-sync';
import { HOUSEHOLD_SYNC_ZONE, SyncZoneRegistryRepository } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { emptyFn } from '@rnw-community/shared';

import { HOUSEHOLD_CLOUD_ZONE, OWNER_RECORD_NAME, makeSyncServiceContext, syncService } from '../../harness';

describe('cloud-sync/household share failed', () => {
    it.effect('tells the user when accepting a family invitation fails', () => {
        const show = vi.spyOn(Toast, 'show').mockImplementation(emptyFn);
        const context = makeSyncServiceContext();

        return context.run(
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
        );
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
