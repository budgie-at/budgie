import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { CLOUD_SYNC_RECORDS } from '../../engine/constant/cloud-sync-records.constant';
import { CloudSyncTransport } from '../../engine/port/cloud-sync-transport.port';
import { CloudSyncHouseholdService } from '../../engine/service/cloud-sync-household.service';

export class HouseholdService extends Context.Service<HouseholdService>()('@budgie/cloud-sync/HouseholdService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const cloudSyncHouseholdService = yield* CloudSyncHouseholdService;
        const zoneName = CLOUD_SYNC_RECORDS.householdZoneName;

        return {
            participants: transport.getShareParticipants(zoneName),
            invite: Effect.fn('HouseholdService.invite')(function* () {
                yield* cloudSyncHouseholdService.prepareHouseholdOwnerZone();
                yield* transport.createHouseholdShare(zoneName);
            }),
            removeParticipant: (participantId: string) => transport.removeParticipant(zoneName, participantId),
            stopSharing: cloudSyncHouseholdService.stopHouseholdSharing(),
            removeEmptyGroup: cloudSyncHouseholdService.removeEmptyHousehold(),
            leave: cloudSyncHouseholdService.leaveHousehold()
        };
    })
}) {
    static readonly layer = Layer.effect(HouseholdService, HouseholdService.make).pipe(Layer.provide(CloudSyncHouseholdService.layer));
}
