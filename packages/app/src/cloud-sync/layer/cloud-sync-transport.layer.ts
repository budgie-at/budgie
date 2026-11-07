import { CloudSyncEventKindEnum, CloudSyncTransport } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Stream from 'effect/Stream';

import { ICloudModule } from '../../../modules/icloud';
import { callNative } from '../utils/call-native.util';

import type { CloudSyncEventType, ICloudRecordId, ICloudRecordPayload, ICloudSyncScope } from '@budgie/cloud-sync';

export const cloudSyncTransportLayer = Layer.effect(
    CloudSyncTransport,
    Effect.gen(function* () {
        const icloud = yield* Effect.orDie(Effect.fromNullishOr(ICloudModule));
        const events = Stream.callback<CloudSyncEventType>(queue =>
            Effect.acquireRelease(
                Effect.sync(() => {
                    const offer = (event: CloudSyncEventType): void => {
                        Queue.offerUnsafe(queue, event);
                    };

                    return [
                        icloud.addListener('onStateSerialization', event => {
                            offer({ kind: CloudSyncEventKindEnum.STATE_SERIALIZATION, event });
                        }),
                        icloud.addListener('onFetchedChanges', event => {
                            offer({ kind: CloudSyncEventKindEnum.FETCHED_CHANGES, event });
                        }),
                        icloud.addListener('onSentChanges', event => {
                            offer({ kind: CloudSyncEventKindEnum.SENT_CHANGES, event });
                        }),
                        icloud.addListener('onAccountChange', event => {
                            offer({ kind: CloudSyncEventKindEnum.ACCOUNT_CHANGE, event });
                        }),
                        icloud.addListener('onZoneChange', event => {
                            offer({ kind: CloudSyncEventKindEnum.ZONE_CHANGE, event });
                        }),
                        icloud.addListener('onWillFetchChanges', event => {
                            offer({ kind: CloudSyncEventKindEnum.WILL_FETCH, event });
                        }),
                        icloud.addListener('onDidFetchChanges', event => {
                            offer({ kind: CloudSyncEventKindEnum.DID_FETCH, event });
                        }),
                        icloud.addListener('onShareAccepted', event => {
                            offer({ kind: CloudSyncEventKindEnum.SHARE_ACCEPTED, event });
                        }),
                        icloud.addListener('onShareChanged', event => {
                            offer({ kind: CloudSyncEventKindEnum.SHARE_CHANGED, event });
                        })
                    ];
                }),
                subscriptions =>
                    Effect.sync(() => {
                        subscriptions.forEach(subscription => {
                            subscription.remove();
                        });
                    })
            )
        );

        return {
            events,
            getAccountStatus: callNative(() => icloud.getAccountStatus()),
            startSync: (scope: ICloudSyncScope, stateSerialization: string | null) =>
                callNative(() => icloud.startSync(scope, stateSerialization)),
            stopSync: (scope: ICloudSyncScope) => callNative(() => icloud.stopSync(scope)),
            syncNow: (scope: ICloudSyncScope) => callNative(() => icloud.syncNow(scope)),
            ensureZone: (scope: ICloudSyncScope, zoneName: string) => callNative(() => icloud.ensureZone(scope, zoneName)),
            deleteZone: (scope: ICloudSyncScope, zoneName: string) => callNative(() => icloud.deleteZone(scope, zoneName)),
            fetchRecord: (scope: ICloudSyncScope, zoneName: string, recordName: string) =>
                callNative(() => icloud.fetchRecord(scope, zoneName, recordName)),
            fetchZoneInventory: (scope: ICloudSyncScope, zoneName: string) => callNative(() => icloud.fetchZoneInventory(scope, zoneName)),
            addPendingSaves: (scope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) =>
                callNative(() => icloud.addPendingSaves(scope, records)),
            addPendingDeletes: (scope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) =>
                callNative(() => icloud.addPendingDeletes(scope, recordIds)),
            createHouseholdShare: (zoneName: string) => callNative(() => icloud.createHouseholdShare(zoneName)),
            getShareParticipants: (zoneName: string) => callNative(() => icloud.getShareParticipants(zoneName)),
            findOwnedHousehold: (zoneName: string) => callNative(() => icloud.findOwnedHousehold(zoneName)),
            findJoinedHousehold: (zoneName: string) => callNative(() => icloud.findJoinedHousehold(zoneName)),
            stopSharing: (zoneName: string) => callNative(() => icloud.stopSharing(zoneName)),
            leaveShare: (zoneName: string) => callNative(() => icloud.leaveShare(zoneName)),
            removeParticipant: (zoneName: string, participantId: string) =>
                callNative(() => icloud.removeParticipant(zoneName, participantId))
        };
    })
);
