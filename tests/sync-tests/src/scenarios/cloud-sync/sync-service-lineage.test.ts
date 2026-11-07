import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { CloudSyncLineageChoiceEnum } from '@app/cloud-sync/enum/cloud-sync-lineage-choice.enum';
import { CloudSyncStatusEnum } from '@app/cloud-sync/enum/cloud-sync-status.enum';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { HOUSEHOLD_SYNC_ZONE, SyncIdentityRepository, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb } from '../../harness';

import { makeSyncServiceContext } from './sync-service-harness';

import type { ICloudFetchedRecord } from '../../../../../packages/app/modules/icloud';

const metaWith = (lineageId: string): ICloudFetchedRecord => ({
    zoneName: 'Personal',
    ownerName: '__defaultOwner__',
    recordName: 'sync-meta',
    recordType: 'SyncMeta',
    systemFields: 'system-meta',
    schemaVersion: 1,
    encryptedFields: { lineageId }
});

const countAccounts = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM accounts')
    .pipe(Effect.map(([row]) => row.total));

describe('cloud-sync/sync-service lineage', () => {
    it.effect('joins automatically when the zone has the same lineage and uploads only the outbox', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* service.reconfigure();

                expect(context.transport.calls.started).toHaveLength(1);
                expect(context.transport.calls.savedBatches.flat().some(({ recordType }) => recordType === 'SyncMeta')).toBe(false);
                expect(context.transport.calls.savedBatches.flat().some(({ recordType }) => recordType === 'Account')).toBe(true);
            })
        );
    });

    it.effect('does not upload when a device with data meets a zone of a different lineage', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;

                yield* seed.account({ title: 'Cash' });
                context.transport.behavior.zoneMeta = metaWith('another-lineage');
                yield* service.reconfigure();

                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).toBe(CloudSyncStatusEnum.LINEAGE_CONFLICT);
                expect(context.transport.calls.started).toHaveLength(0);
                expect(context.transport.calls.savedBatches).toHaveLength(0);
            })
        );
    });

    it.effect('adopts the zone lineage on a device without data', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                context.transport.behavior.zoneMeta = metaWith('another-lineage');
                yield* service.reconfigure();

                expect(yield* identity.findLineageId()).toBe('another-lineage');
                expect(context.transport.calls.started).toHaveLength(1);
                expect(context.transport.calls.savedBatches.flat().some(({ recordType }) => recordType === 'SyncMeta')).toBe(false);
            })
        );
    });

    it.effect('"Use iCloud data" takes a safety copy, replaces local data and joins the zone', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                context.transport.behavior.zoneMeta = metaWith('another-lineage');
                yield* service.reconfigure();
                yield* service.resolveLineageConflict(CloudSyncLineageChoiceEnum.USE_ICLOUD_DATA);

                expect(context.safetyCopy.holder.created).toBe(1);
                expect(yield* countAccounts).toBe(0);
                expect(yield* identity.findLineageId()).toBe('another-lineage');
                expect(context.transport.calls.started).toEqual([null]);
                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).not.toBe(CloudSyncStatusEnum.LINEAGE_CONFLICT);
            })
        );
    });

    it.effect('"Keep this device\'s" takes a safety copy, replaces the zone and re-uploads everything', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;

                const account = yield* seed.account({ title: 'Cash' });

                yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
                context.transport.behavior.zoneMeta = metaWith('another-lineage');
                yield* service.reconfigure();
                yield* service.resolveLineageConflict(CloudSyncLineageChoiceEnum.KEEP_THIS_DEVICE);

                const pushedTypes = context.transport.calls.savedBatches.flat().map(({ recordType }) => recordType);

                expect(context.safetyCopy.holder.created).toBe(1);
                expect(context.transport.calls.deletedZones).toEqual(['Personal']);
                expect(pushedTypes).toEqual(['SyncMeta']);
                expect(yield* countAccounts).toBeGreaterThan(0);

                const outboxIds = yield* testDb.$client.unsafe<{ readonly syncId: string }>('SELECT sync_id AS syncId FROM sync_outbox');

                expect(outboxIds.map(({ syncId }) => syncId)).toContain(account.syncId);
            })
        );
    });

    it.effect.each([CloudSyncLineageChoiceEnum.USE_ICLOUD_DATA, CloudSyncLineageChoiceEnum.KEEP_THIS_DEVICE])(
        'registers a family joined while the lineage prompt was up once "%s" resolves it',
        choice => {
            const context = makeSyncServiceContext();

            return context.run(
                Effect.gen(function* () {
                    const service = yield* CloudSyncService;
                    const registry = yield* SyncZoneRegistryRepository;

                    yield* seed.account({ title: 'Cash' });
                    context.transport.behavior.zoneMeta = metaWith('another-lineage');
                    yield* service.reconfigure();
                    context.transport.behavior.joinedHousehold = { zoneName: 'Household', ownerName: 'owner-user-record' };

                    expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeUndefined();

                    yield* service.resolveLineageConflict(choice);

                    expect((yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE))?.role).toBe(SyncZoneRoleEnum.PARTICIPANT);
                })
            );
        }
    );
});
