import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';

import { ICloudModule } from '../../../modules/icloud';
import { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';
import { CloudSyncTransportError } from '../error/cloud-sync-transport.error';

import type { ICloudRecordId, ICloudRecordPayload, ICloudSyncScope } from '../../../modules/icloud';
import type { CloudSyncEventType } from '../type/cloud-sync-event.type';

export class CloudSyncTransport extends Context.Service<CloudSyncTransport>()('@budgie/app/CloudSyncTransport', {
    make: Effect.gen(function* () {
        const icloud = yield* Effect.orDie(Effect.fromNullishOr(ICloudModule));
        const isNativeError = Schema.is(Schema.Struct({ code: Schema.String, message: Schema.String }));

        const call = <A>(run: () => Promise<A>) =>
            Effect.tryPromise({ try: run, catch: cause => cause }).pipe(
                Effect.catch(cause =>
                    isNativeError(cause)
                        ? Effect.fail(
                              new CloudSyncTransportError({
                                  code: cause.code,
                                  message: cause.message.split('\n→ Caused by: ').pop() ?? cause.message
                              })
                          )
                        : Effect.die(cause)
                )
            );

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
            getAccountStatus: () => call(() => icloud.getAccountStatus()),
            startSync: (scope: ICloudSyncScope, stateSerialization: string | null) =>
                call(() => icloud.startSync(scope, stateSerialization)),
            stopSync: (scope: ICloudSyncScope) => call(() => icloud.stopSync(scope)),
            syncNow: (scope: ICloudSyncScope) => call(() => icloud.syncNow(scope)),
            ensureZone: (scope: ICloudSyncScope, zoneName: string) => call(() => icloud.ensureZone(scope, zoneName)),
            deleteZone: (scope: ICloudSyncScope, zoneName: string) => call(() => icloud.deleteZone(scope, zoneName)),
            fetchRecord: (scope: ICloudSyncScope, zoneName: string, recordName: string) =>
                call(() => icloud.fetchRecord(scope, zoneName, recordName)),
            fetchZoneInventory: (scope: ICloudSyncScope, zoneName: string) => call(() => icloud.fetchZoneInventory(scope, zoneName)),
            addPendingSaves: (scope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) =>
                call(() => icloud.addPendingSaves(scope, records)),
            addPendingDeletes: (scope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) =>
                call(() => icloud.addPendingDeletes(scope, recordIds)),
            confirmFetchedBatch: (scope: ICloudSyncScope, batchId: string) => call(() => icloud.confirmFetchedBatch(scope, batchId)),
            createHouseholdShare: (zoneName: string) => call(() => icloud.createHouseholdShare(zoneName)),
            getShareParticipants: (zoneName: string) => call(() => icloud.getShareParticipants(zoneName)),
            findJoinedHousehold: (zoneName: string) => call(() => icloud.findJoinedHousehold(zoneName)),
            stopSharing: (zoneName: string) => call(() => icloud.stopSharing(zoneName)),
            leaveShare: (zoneName: string) => call(() => icloud.leaveShare(zoneName)),
            removeParticipant: (zoneName: string, participantId: string) => call(() => icloud.removeParticipant(zoneName, participantId))
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncTransport, CloudSyncTransport.make);
}
