import { SYNC_IDENTITY_TABLES } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';

import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncDatabaseChanges } from '../port/cloud-sync-database-changes.port';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncTransport } from '../port/cloud-sync-transport.port';
import { logAndContinue } from '../utils/log-and-continue.util';

import { CloudSyncDrainService } from './cloud-sync-drain.service';
import { CloudSyncEngineService } from './cloud-sync-engine.service';
import { CloudSyncFetchService } from './cloud-sync-fetch.service';
import { CloudSyncHouseholdService } from './cloud-sync-household.service';
import { CloudSyncSentService } from './cloud-sync-sent.service';
import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { CloudSyncEventType } from '../type/cloud-sync-event.type';

export class CloudSyncService extends Context.Service<CloudSyncService>()('@budgie/cloud-sync/CloudSyncService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const host = yield* CloudSyncHost;
        const databaseChanges = yield* CloudSyncDatabaseChanges;
        const state = yield* CloudSyncSessionState;
        const drainService = yield* CloudSyncDrainService;
        const engineService = yield* CloudSyncEngineService;
        const householdService = yield* CloudSyncHouseholdService;
        const fetchService = yield* CloudSyncFetchService;
        const sentService = yield* CloudSyncSentService;
        const scope = ICloudSyncScope.PRIVATE;
        const periodicFetchInterval = Duration.minutes(2);
        const localWriteDebounce = Duration.seconds(2);
        const settingsDebounce = Duration.millis(500);
        const userDataTableNames = new Set(SYNC_IDENTITY_TABLES.map(table => table.name));
        const { locked } = state;
        const { drain } = drainService;
        const { reconfigure, reconfigureUnlocked } = engineService;
        const { discoverHousehold, finishHouseholdCleanupUnlocked } = householdService;

        const dispatchEvent = (item: CloudSyncEventType) => {
            switch (item.kind) {
                case CloudSyncEventKindEnum.STATE_SERIALIZATION:
                    return fetchService.handleStateSerialization(item.event);
                case CloudSyncEventKindEnum.FETCHED_CHANGES:
                    return fetchService.handleFetchedChanges(item.event);
                case CloudSyncEventKindEnum.SENT_CHANGES:
                    return sentService.handleSentChanges(item.event);
                case CloudSyncEventKindEnum.ACCOUNT_CHANGE:
                    return engineService.handleAccountChange(item.event);
                case CloudSyncEventKindEnum.ZONE_CHANGE:
                    return engineService.handleZoneChange(item.event);
                case CloudSyncEventKindEnum.WILL_FETCH:
                    return fetchService.handleWillFetch(item.event);
                case CloudSyncEventKindEnum.DID_FETCH:
                    return fetchService.handleDidFetch(item.event);
                case CloudSyncEventKindEnum.SHARE_ACCEPTED:
                    return householdService.handleShareAccepted(item.event);
                case CloudSyncEventKindEnum.SHARE_CHANGED:
                    return householdService.handleShareChanged(item.event);
                default:
                    return Effect.void;
            }
        };

        const foreground = Effect.fn('CloudSyncService.foreground')(function* () {
            const current = yield* Ref.get(state.session);

            if (current.isEngineRunning) {
                state.failedKeys.clear();
                state.quotaKeys.clear();
                yield* drainService.drainUnlocked();
                yield* transport.syncNow(scope).pipe(logAndContinue, Effect.forkDetach);

                if (current.isSharedEngineRunning) {
                    yield* transport.syncNow(ICloudSyncScope.SHARED).pipe(logAndContinue, Effect.forkDetach);
                }
            } else {
                yield* reconfigureUnlocked();
            }
        }, locked);

        const fetchPeriodically = Effect.fnUntraced(function* () {
            const current = yield* Ref.get(state.session);

            if (current.isEngineRunning) {
                yield* transport.syncNow(scope).pipe(logAndContinue, Effect.forkDetach);
            }

            if (current.isSharedEngineRunning) {
                yield* transport.syncNow(ICloudSyncScope.SHARED).pipe(logAndContinue, Effect.forkDetach);
            }
        });

        const forkConsumer = <A, E, R, R2>(stream: Stream.Stream<A, E, R>, handle: (event: A) => Effect.Effect<unknown, unknown, R2>) =>
            Effect.forkDetach(Stream.runForEach(stream, event => logAndContinue(handle(event))));

        return {
            reconfigure,
            drain,
            discoverHousehold,
            resolveLineageConflict: engineService.resolveLineageConflict,
            leaveHousehold: householdService.leaveHousehold,
            start: Effect.fn('CloudSyncService.start')(function* () {
                yield* state.publishStoredOwnerName();
                yield* forkConsumer(transport.events, dispatchEvent);
                yield* forkConsumer(
                    Stream.filter(host.foregroundChanges, isForeground => isForeground),
                    () => foreground().pipe(Effect.andThen(discoverHousehold), Effect.andThen(host.bumpHouseholdRefresh))
                );
                yield* forkConsumer(
                    Stream.concat(Stream.fromEffect(host.isForeground), host.foregroundChanges).pipe(
                        Stream.switchMap(isForeground => (isForeground ? Stream.tick(periodicFetchInterval) : Stream.empty))
                    ),
                    fetchPeriodically
                );
                yield* forkConsumer(
                    databaseChanges.pipe(
                        Stream.filter(tableNames => tableNames.some(tableName => userDataTableNames.has(tableName))),
                        Stream.debounce(localWriteDebounce)
                    ),
                    () => drain
                );
                yield* forkConsumer(
                    databaseChanges.pipe(
                        Stream.filter(tableNames => tableNames.includes('settings')),
                        Stream.debounce(settingsDebounce)
                    ),
                    () => reconfigure
                );
                yield* locked(finishHouseholdCleanupUnlocked());
                yield* reconfigure;
                yield* discoverHousehold;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncService, CloudSyncService.make).pipe(
        Layer.provide([
            cloudSyncDomainLayer,
            CloudSyncSessionState.layer,
            CloudSyncDrainService.layer,
            CloudSyncEngineService.layer,
            CloudSyncHouseholdService.layer,
            CloudSyncFetchService.layer,
            CloudSyncSentService.layer
        ])
    );
}
