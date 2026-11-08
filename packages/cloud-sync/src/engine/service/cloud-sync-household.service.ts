import { HOUSEHOLD_SYNC_ZONE, SyncDatabaseScopeEnum, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { HouseholdEndModeEnum } from '../../household/enum/household-end-mode.enum';
import { HouseholdJoinStatusEnum } from '../../household/enum/household-join-status.enum';
import { HouseholdMembershipService } from '../../household/service/household-membership.service';
import { ICLOUD_DEFAULT_OWNER_NAME } from '../../transport/constant/icloud-default-owner-name.constant';
import { ICloudAccountStatusEnum } from '../../transport/enum/icloud-account-status.enum';
import { ICloudErrorCode } from '../../transport/enum/icloud-error-code.enum';
import { ICloudShareChange } from '../../transport/enum/icloud-share-change.enum';
import { ICloudShareOutcome } from '../../transport/enum/icloud-share-outcome.enum';
import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncStateStore } from '../port/cloud-sync-state-store.port';
import { CloudSyncTransport } from '../port/cloud-sync-transport.port';
import { logAndContinue } from '../utils/log-and-continue.util';

import { CloudSyncDrainService } from './cloud-sync-drain.service';
import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { ICloudShareAcceptedEvent } from '../../transport/interface/icloud-share-accepted-event.interface';
import type { ICloudShareChangedEvent } from '../../transport/interface/icloud-share-changed-event.interface';

export class CloudSyncHouseholdService extends Context.Service<CloudSyncHouseholdService>()(
    '@budgie/cloud-sync/CloudSyncHouseholdService',
    {
        make: Effect.gen(function* () {
            const transport = yield* CloudSyncTransport;
            const stateStore = yield* CloudSyncStateStore;
            const host = yield* CloudSyncHost;
            const zoneRegistryRepository = yield* SyncZoneRegistryRepository;
            const householdMembershipService = yield* HouseholdMembershipService;
            const state = yield* CloudSyncSessionState;
            const drainService = yield* CloudSyncDrainService;
            const scope = ICloudSyncScope.PRIVATE;
            const { locked, patch, refreshZones } = state;
            const { drainUnlocked } = drainService;

            const endHouseholdUnlocked = Effect.fnUntraced(function* (mode: HouseholdEndModeEnum) {
                if ((yield* Ref.get(state.session)).isSharedEngineRunning) {
                    yield* transport
                        .stopSync(ICloudSyncScope.SHARED)
                        .pipe(Effect.catchTags({ CloudSyncTransportError: () => Effect.void }));
                }

                for (const [itemKey, item] of state.pushed) {
                    if (item.syncZone === HOUSEHOLD_SYNC_ZONE) {
                        state.dropItem(itemKey);
                    }
                }

                for (const keys of [state.heldKeys, state.failedKeys, state.quotaKeys]) {
                    for (const key of keys) {
                        if (key.startsWith(`${HOUSEHOLD_SYNC_ZONE}|`)) {
                            keys.delete(key);
                        }
                    }
                }

                yield* mode === HouseholdEndModeEnum.KEEP_PERSONAL_COPY
                    ? householdMembershipService.keepPersonalCopy()
                    : householdMembershipService.dropHouseholdData();
                yield* stateStore.update({ sharedStateSerialization: null, householdOwnerDisplayName: null });
                yield* patch({ isSharedEngineRunning: false, isSharedReconciling: false });
                yield* refreshZones();
                yield* host.publishJoin(HouseholdJoinStatusEnum.NONE, null);
                yield* host.bumpHouseholdRefresh;

                if (mode === HouseholdEndModeEnum.KEEP_PERSONAL_COPY) {
                    yield* drainUnlocked();
                }
            });

            const isHouseholdShareActive = (zoneName: string) =>
                transport.getShareParticipants(zoneName).pipe(
                    Effect.map(isNotEmptyArray),
                    Effect.catchTags({
                        CloudSyncTransportError: error =>
                            Effect.succeed(
                                error.code !== ICloudErrorCode.ZONE_NOT_FOUND && error.code !== ICloudErrorCode.USER_DELETED_ZONE
                            )
                    })
                );

            const refreshPrivateOwnerName = Effect.fnUntraced(
                function* () {
                    const household = state.zones.get(HOUSEHOLD_SYNC_ZONE);
                    const participants = isDefined(household) ? yield* transport.getShareParticipants(household.zoneName) : [];
                    yield* Ref.set(
                        state.privateOwnerName,
                        participants.find(participant => participant.isCurrentUser)?.displayName ?? null
                    );
                },
                Effect.catchTag('CloudSyncTransportError', () => Effect.void)
            );

            const startSharedEngineUnlocked = Effect.fnUntraced(function* (isRestoring: boolean) {
                const household = state.zones.get(HOUSEHOLD_SYNC_ZONE);

                if (!isDefined(household) || household.databaseScope !== SyncDatabaseScopeEnum.SHARED) {
                    return;
                }

                if (isRestoring && !(yield* isHouseholdShareActive(household.zoneName))) {
                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.DROP);

                    return;
                }

                yield* refreshPrivateOwnerName();
                const sharedStateSerialization = isRestoring ? null : (yield* stateStore.read).sharedStateSerialization;

                yield* stateStore.update({ sharedStateSerialization });
                yield* transport
                    .startSync(ICloudSyncScope.SHARED, sharedStateSerialization)
                    .pipe(
                        Effect.catchTag('CloudSyncTransportError', error =>
                            error.code === ICloudErrorCode.INVALID_STATE
                                ? stateStore
                                      .update({ sharedStateSerialization: null })
                                      .pipe(Effect.andThen(transport.startSync(ICloudSyncScope.SHARED, null)))
                                : Effect.fail(error)
                        )
                    );
                yield* patch({
                    isSharedEngineRunning: true,
                    isSharedReconciling: isRestoring && (yield* Ref.get(state.session)).isReconciling
                });
                yield* drainUnlocked();
                yield* transport.syncNow(ICloudSyncScope.SHARED).pipe(logAndContinue, Effect.forkDetach);
            });

            const upsertOwnerHouseholdZone = () =>
                zoneRegistryRepository.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: CLOUD_SYNC_RECORDS.householdZoneName,
                    ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });

            const registerJoinedHouseholdUnlocked = Effect.fnUntraced(function* (
                zone: Pick<ICloudShareAcceptedEvent, 'zoneName' | 'ownerName' | 'ownerDisplayName'>
            ) {
                const existing = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);

                if (isDefined(existing) && (existing.role === SyncZoneRoleEnum.OWNER || existing.ownerName !== zone.ownerName)) {
                    return;
                }

                yield* zoneRegistryRepository.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: zone.zoneName,
                    ownerName: zone.ownerName,
                    databaseScope: SyncDatabaseScopeEnum.SHARED,
                    role: SyncZoneRoleEnum.PARTICIPANT
                });
                yield* stateStore.update({
                    householdOwnerDisplayName: isNotEmptyString(zone.ownerDisplayName) ? zone.ownerDisplayName : null
                });
                yield* refreshZones();

                if ((yield* Ref.get(state.session)).isEngineRunning) {
                    yield* startSharedEngineUnlocked(false);
                }

                yield* host.bumpHouseholdRefresh;
            });

            const publishJoinedUnlocked = (zone: Pick<ICloudShareAcceptedEvent, 'ownerName' | 'ownerDisplayName'>) =>
                Effect.suspend(() => {
                    const household = state.zones.get(HOUSEHOLD_SYNC_ZONE);
                    const isJoined = household?.role === SyncZoneRoleEnum.PARTICIPANT && household.ownerName === zone.ownerName;

                    return host.publishJoin(
                        isJoined ? HouseholdJoinStatusEnum.JOINED : HouseholdJoinStatusEnum.NONE,
                        isJoined ? (zone.ownerDisplayName ?? null) : null
                    );
                });

            const discoverHouseholdUnlocked = Effect.fnUntraced(
                function* () {
                    const existingHousehold = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);

                    if (isDefined(existingHousehold)) {
                        return;
                    }

                    if ((yield* stateStore.read).isHouseholdCleanupPending) {
                        return;
                    }

                    const owned = yield* transport.findOwnedHousehold(CLOUD_SYNC_RECORDS.householdZoneName);

                    if (isDefined(owned)) {
                        yield* upsertOwnerHouseholdZone();
                        yield* refreshZones();

                        if ((yield* Ref.get(state.session)).isEngineRunning) {
                            yield* startSharedEngineUnlocked(false);
                        }

                        yield* host.bumpHouseholdRefresh;

                        return;
                    }

                    const joined = yield* transport.findJoinedHousehold(CLOUD_SYNC_RECORDS.householdZoneName);

                    if (isDefined(joined)) {
                        yield* registerJoinedHouseholdUnlocked(joined);
                        yield* publishJoinedUnlocked(joined);
                    }
                },
                Effect.catchTags({ CloudSyncTransportError: () => Effect.void })
            );

            const deleteHouseholdZone = transport
                .stopSharing(CLOUD_SYNC_RECORDS.householdZoneName)
                .pipe(
                    Effect.catchTags({ CloudSyncTransportError: () => Effect.void }),
                    Effect.andThen(transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName)),
                    Effect.as(true),
                    Effect.catchTags({ CloudSyncTransportError: error => Effect.succeed(error.code === ICloudErrorCode.ZONE_NOT_FOUND) })
                );

            const finishHouseholdCleanupUnlocked = Effect.fnUntraced(
                function* () {
                    if (!(yield* stateStore.read).isHouseholdCleanupPending) {
                        return;
                    }

                    if ((yield* transport.getAccountStatus).status !== ICloudAccountStatusEnum.AVAILABLE) {
                        return;
                    }

                    if (yield* deleteHouseholdZone) {
                        yield* stateStore.update({ isHouseholdCleanupPending: false });
                    }
                },
                Effect.catchTags({ CloudSyncTransportError: () => Effect.void })
            );

            const prepareHouseholdOwnerZone = Effect.fn('CloudSyncHouseholdService.prepareHouseholdOwnerZone')(function* () {
                const existing = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);

                if (existing?.role === SyncZoneRoleEnum.PARTICIPANT) {
                    return;
                }

                yield* finishHouseholdCleanupUnlocked();
                yield* transport.ensureZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                yield* upsertOwnerHouseholdZone();
                yield* refreshZones();
            }, locked);

            return {
                endHouseholdUnlocked,
                prepareHouseholdOwnerZone,
                isHouseholdShareActive,
                refreshPrivateOwnerName,
                startSharedEngineUnlocked,
                discoverHouseholdUnlocked,
                finishHouseholdCleanupUnlocked,
                discoverHousehold: locked(discoverHouseholdUnlocked()),
                participants: transport.getShareParticipants(CLOUD_SYNC_RECORDS.householdZoneName),
                removeParticipant: (participantId: string) =>
                    transport.removeParticipant(CLOUD_SYNC_RECORDS.householdZoneName, participantId),
                handleShareAccepted: Effect.fn('CloudSyncHouseholdService.handleShareAccepted')(function* (
                    event: ICloudShareAcceptedEvent
                ) {
                    if (event.outcome === ICloudShareOutcome.JOINING) {
                        yield* host.publishJoin(HouseholdJoinStatusEnum.JOINING, event.ownerDisplayName ?? null);

                        return;
                    }

                    if (event.outcome !== ICloudShareOutcome.ACCEPTED) {
                        yield* host.publishJoin(HouseholdJoinStatusEnum.FAILED, event.ownerDisplayName ?? null);
                        yield* host.notifyJoinFailed;
                        yield* locked(host.bumpHouseholdRefresh);

                        return;
                    }

                    yield* locked(registerJoinedHouseholdUnlocked(event).pipe(Effect.andThen(publishJoinedUnlocked(event))));
                }),
                handleShareChanged: Effect.fn('CloudSyncHouseholdService.handleShareChanged')(function* (event: ICloudShareChangedEvent) {
                    if (
                        event.change === ICloudShareChange.STOPPED &&
                        state.zones.get(HOUSEHOLD_SYNC_ZONE)?.role === SyncZoneRoleEnum.OWNER
                    ) {
                        yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                        yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
                    } else {
                        yield* host.bumpHouseholdRefresh;
                    }
                }, locked),
                invite: Effect.fn('CloudSyncHouseholdService.invite')(function* () {
                    yield* prepareHouseholdOwnerZone();
                    yield* transport.createHouseholdShare(CLOUD_SYNC_RECORDS.householdZoneName);
                    yield* refreshPrivateOwnerName();
                }),
                stopHouseholdSharing: Effect.fn('CloudSyncHouseholdService.stopHouseholdSharing')(function* () {
                    yield* transport.stopSharing(CLOUD_SYNC_RECORDS.householdZoneName);
                    yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
                }, locked),
                removeEmptyHousehold: Effect.fn('CloudSyncHouseholdService.removeEmptyHousehold')(function* () {
                    if (!(yield* deleteHouseholdZone)) {
                        yield* stateStore.update({ isHouseholdCleanupPending: true });
                    }

                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
                }, locked),
                leaveHousehold: Effect.fn('CloudSyncHouseholdService.leaveHousehold')(function* () {
                    yield* transport.leaveShare(CLOUD_SYNC_RECORDS.householdZoneName).pipe(
                        Effect.catchIf(
                            error => error.code === ICloudErrorCode.ZONE_NOT_FOUND || error.code === ICloudErrorCode.UNKNOWN_ITEM,
                            () => Effect.void
                        )
                    );
                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
                }, locked)
            };
        })
    }
) {
    static readonly layer = Layer.effect(CloudSyncHouseholdService, CloudSyncHouseholdService.make).pipe(
        Layer.provide([cloudSyncDomainLayer, CloudSyncSessionState.layer, CloudSyncDrainService.layer])
    );
}
