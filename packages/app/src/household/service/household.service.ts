import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { CLOUD_SYNC_RECORDS } from '../../cloud-sync/constant/cloud-sync-records.constant';
import { CloudSyncTransport } from '../../cloud-sync/service/cloud-sync-transport.service';
import { CloudSyncService } from '../../cloud-sync/service/cloud-sync.service';

export class HouseholdService extends Context.Service<HouseholdService>()('@budgie/app/HouseholdService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const cloudSyncService = yield* CloudSyncService;
        const zoneName = CLOUD_SYNC_RECORDS.householdZoneName;

        return {
            participants: transport.getShareParticipants(zoneName),
            invite: Effect.fn('HouseholdService.invite')(function* () {
                yield* cloudSyncService.prepareHouseholdOwnerZone();
                yield* transport.createHouseholdShare(zoneName);
            }),
            removeParticipant: (participantId: string) => transport.removeParticipant(zoneName, participantId),
            stopSharing: cloudSyncService.stopHouseholdSharing(),
            removeEmptyGroup: cloudSyncService.removeEmptyHousehold(),
            leave: cloudSyncService.leaveHousehold()
        };
    })
}) {
    static readonly layer = Layer.effect(HouseholdService, HouseholdService.make).pipe(
        Layer.provide([CloudSyncTransport.layer, CloudSyncService.layer])
    );
}
