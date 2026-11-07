import { SyncOutboxRepository, ICLOUD_DEFAULT_OWNER_NAME } from '@budgie/cloud-sync';
import { SyncDatabaseScopeEnum, SyncOutboxOperationEnum, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb, seedCrossZoneTransfer, makeSyncServiceContext, savedFrom, sentEvent, syncService } from '../../harness';

const countLegRecords = testDb.$client
    .unsafe<{ readonly total: number }>("SELECT COUNT(*) AS total FROM sync_record WHERE record_type = 'TransactionLeg'")
    .pipe(Effect.map(([row]) => row.total));

describe('cloud-sync/sync-service split transactions', () => {
    it.effect('deletes the stale leg record when a split transfer stops being split', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* syncService;
                const registry = yield* SyncZoneRegistryRepository;
                const outbox = yield* SyncOutboxRepository;
                const { sharedAccount, transfer } = yield* seedCrossZoneTransfer(testDb, 'household');

                yield* registry.upsert({
                    zoneLabel: 'household',
                    zoneName: 'Household',
                    ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });
                yield* service.reconfigure;
                yield* service.handleSentChanges(
                    sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') })
                );

                const firstUpload = context.transport.calls.savedBatches.slice(1).flat();
                const leg = firstUpload.find(({ recordType }) => recordType === 'TransactionLeg');

                expect(leg?.zoneName).toBe('Household');

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(firstUpload, 'system-1') }));

                expect(yield* countLegRecords).toBe(1);

                yield* testDb.$client.unsafe("UPDATE accounts SET sync_zone = 'personal' WHERE id = ?", [sharedAccount.id]);
                yield* testDb.$client.unsafe("UPDATE transaction_entries SET sync_zone = 'personal' WHERE account_id = ?", [
                    sharedAccount.id
                ]);
                yield* outbox.enqueue({
                    recordType: 'Transaction',
                    syncZone: 'personal',
                    syncId: transfer.syncId ?? '',
                    operation: SyncOutboxOperationEnum.SAVE,
                    changedColumns: '[]'
                });

                const batchesBefore = context.transport.calls.savedBatches.length;

                yield* service.drain;

                const deleteIds = context.transport.calls.deletedBatches.flat();
                const resaved = context.transport.calls.savedBatches.slice(batchesBefore).flat();

                expect(deleteIds).toEqual([{ zoneName: 'Household', ownerName: ICLOUD_DEFAULT_OWNER_NAME, recordName: leg?.recordName }]);
                expect(resaved.some(({ recordType }) => recordType === 'TransactionLeg')).toBe(false);
                expect(resaved.find(({ recordType }) => recordType === 'Transaction')?.encryptedFields['linkId']).toBeNull();

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(resaved, 'system-2'), deletedRecords: deleteIds }));

                expect(yield* countLegRecords).toBe(0);
            })
        );
    });
});
