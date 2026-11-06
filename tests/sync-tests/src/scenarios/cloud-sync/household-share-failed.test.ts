import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { ICloudShareOutcome } from '../../../../../packages/app/modules/icloud';
import Toast from '../../../../test-kit/src/vitest/toast-message.shim';

import { HOUSEHOLD_CLOUD_ZONE, OWNER_RECORD_NAME } from './household-harness';
import { makeSyncServiceContext } from './sync-service-harness';

describe('cloud-sync/household share failed', () => {
    it.effect('tells the user when accepting a family invitation fails', () => {
        const show = vi.spyOn(Toast, 'show').mockImplementation(() => undefined);
        const context = makeSyncServiceContext();

        return context
            .run(
                Effect.gen(function* () {
                    const service = yield* CloudSyncService;

                    yield* service.handleShareAccepted({
                        zoneName: HOUSEHOLD_CLOUD_ZONE,
                        ownerName: OWNER_RECORD_NAME,
                        outcome: ICloudShareOutcome.FAILED
                    });

                    expect(show).toHaveBeenCalledTimes(1);
                    expect(show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text1: 'Could not join the family' }));
                })
            )
            .pipe(Effect.ensuring(Effect.sync(() => show.mockRestore())));
    });
});
