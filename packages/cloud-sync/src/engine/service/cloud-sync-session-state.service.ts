import {
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SyncDatabaseScopeEnum,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { HouseholdEndModeEnum } from '../../household/enum/household-end-mode.enum';
import { HouseholdRoleEnum } from '../../household/enum/household-role.enum';
import { ICLOUD_DEFAULT_OWNER_NAME } from '../../transport/constant/icloud-default-owner-name.constant';
import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncStateStore } from '../port/cloud-sync-state-store.port';
import { buildCloudSyncKey } from '../utils/build-cloud-sync-key.util';

import type { ICloudRecordId } from '../../transport/interface/icloud-record-id.interface';
import type { CloudSyncEnvelopeInterface } from '../interface/cloud-sync-envelope.interface';
import type { CloudSyncPushedItemInterface } from '../interface/cloud-sync-pushed-item.interface';
import type { CloudSyncSessionInterface } from '../interface/cloud-sync-session.interface';
import type { SyncZoneRegistryEntityInterface } from '@budgie/contracts';

export class CloudSyncSessionState extends Context.Service<CloudSyncSessionState>()('@budgie/cloud-sync/CloudSyncSessionState', {
    make: Effect.gen(function* () {
        const host = yield* CloudSyncHost;
        const stateStore = yield* CloudSyncStateStore;
        const zoneRegistryRepository = yield* SyncZoneRegistryRepository;
        const lock = yield* Semaphore.make(1);
        const session = yield* Ref.make<CloudSyncSessionInterface>({
            isEngineRunning: false,
            isSharedEngineRunning: false,
            isAwaitingMeta: false,
            isReconciling: false,
            isSharedReconciling: false,
            isQuotaExceeded: false,
            isFetching: false,
            blocked: null,
            lastSyncedAt: null,
            fetchedRecordCount: 0,
            isInitialFetchComplete: false
        });
        const zones = new Map<string, Pick<SyncZoneRegistryEntityInterface, 'databaseScope' | 'ownerName' | 'role' | 'zoneName'>>();
        const labelByZone = new Map<string, string>();
        const pushed = new Map<string, CloudSyncPushedItemInterface>();
        const itemKeyByRecordKey = new Map<string, string>();
        const sidePending = new Map<string, CloudSyncEnvelopeInterface>();
        const heldKeys = new Set<string>();
        const failedKeys = new Set<string>();
        const quotaKeys = new Set<string>();

        const publish = Effect.flatMap(Ref.get(session), current => {
            const household = zones.get(HOUSEHOLD_SYNC_ZONE);
            const memberRole = household?.role === SyncZoneRoleEnum.OWNER ? HouseholdRoleEnum.OWNER : HouseholdRoleEnum.MEMBER;
            const role = isDefined(household) ? memberRole : HouseholdRoleEnum.NONE;
            const isReady =
                isDefined(household) &&
                (household.databaseScope === SyncDatabaseScopeEnum.SHARED ? current.isSharedEngineRunning : current.isEngineRunning);

            return host
                .publishStatus({
                    status:
                        current.blocked ?? (current.isFetching || pushed.size > 0 ? CloudSyncStatusEnum.SYNCING : CloudSyncStatusEnum.IDLE),
                    lastSyncedAt: current.lastSyncedAt,
                    fetchedRecordCount: current.fetchedRecordCount,
                    isInitialFetchComplete: current.isInitialFetchComplete,
                    isQuotaExceeded: current.isQuotaExceeded
                })
                .pipe(Effect.andThen(host.publishHousehold(role, isReady)));
        });

        return {
            locked: lock.withPermits(1),
            session,
            zones,
            pushed,
            itemKeyByRecordKey,
            sidePending,
            heldKeys,
            failedKeys,
            quotaKeys,
            publish,
            scopeOf: (label: string): ICloudSyncScope =>
                zones.get(label)?.databaseScope === SyncDatabaseScopeEnum.SHARED ? ICloudSyncScope.SHARED : ICloudSyncScope.PRIVATE,
            householdEndMode: (): HouseholdEndModeEnum =>
                zones.get(HOUSEHOLD_SYNC_ZONE)?.role === SyncZoneRoleEnum.PARTICIPANT
                    ? HouseholdEndModeEnum.DROP
                    : HouseholdEndModeEnum.KEEP_PERSONAL_COPY,
            labelOf: (id: Pick<ICloudRecordId, 'ownerName' | 'zoneName'>): string | undefined =>
                labelByZone.get(buildCloudSyncKey(id.ownerName, id.zoneName)),
            patch: (partial: Partial<CloudSyncSessionInterface>) =>
                Ref.update(session, current => ({ ...current, ...partial })).pipe(Effect.andThen(publish)),
            dropItem: (itemKey: string): void => {
                const item = pushed.get(itemKey);

                item?.records.forEach(record => itemKeyByRecordKey.delete(buildCloudSyncKey(record.zone, record.recordName)));
                item?.deleteTargets.forEach(target => itemKeyByRecordKey.delete(buildCloudSyncKey(target.zone, target.recordName)));
                pushed.delete(itemKey);
            },
            clearTracking: (): void => {
                pushed.clear();
                itemKeyByRecordKey.clear();
                sidePending.clear();
                heldKeys.clear();
                failedKeys.clear();
                quotaKeys.clear();
            },
            refreshZones: Effect.fnUntraced(function* () {
                yield* zoneRegistryRepository.upsert({
                    zoneLabel: PERSONAL_SYNC_ZONE,
                    zoneName: CLOUD_SYNC_RECORDS.personalZoneName,
                    ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });
                zones.clear();
                labelByZone.clear();

                for (const zone of yield* zoneRegistryRepository.findAll) {
                    zones.set(zone.zoneLabel, zone);
                    labelByZone.set(buildCloudSyncKey(zone.ownerName, zone.zoneName), zone.zoneLabel);
                }

                const storedOwnerName =
                    zones.get(HOUSEHOLD_SYNC_ZONE)?.role === SyncZoneRoleEnum.PARTICIPANT
                        ? (yield* stateStore.read).householdOwnerDisplayName
                        : null;

                yield* host.publishHouseholdOwnerName(storedOwnerName);
                yield* publish;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncSessionState, CloudSyncSessionState.make).pipe(
        Layer.provide(SyncZoneRegistryRepository.layer)
    );
}
