import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { YIELD_TO_UI } from '../../../@generic/constant/yield-to-ui.constant';
import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SyncOutboxRepository } from '../../repository/sync-outbox.repository';
import { SyncRecordRepository } from '../../repository/sync-record.repository';
import { SyncResetRepository } from '../../repository/sync-reset.repository';

import type { SyncApplyResultInterface } from '../../apply/interface/sync-apply-result.interface';
import type { SyncIncomingDeletionInterface } from '../../apply/interface/sync-incoming-deletion.interface';

export class SyncRestoreReconciliationService extends Context.Service<SyncRestoreReconciliationService>()(
    '@budgie/contracts/SyncRestoreReconciliationService',
    {
        make: Effect.gen(function* () {
            const recordRepository = yield* SyncRecordRepository;
            const outboxRepository = yield* SyncOutboxRepository;
            const resetRepository = yield* SyncResetRepository;
            const applyService = yield* SyncApplyService;
            const dataRecordTypes = new Set<string>(Object.values(SYNC_RECORD_DEFINITIONS).map(({ recordType }) => recordType));
            const deletionChunkSize = 500;

            return {
                prepare: Effect.fn('SyncRestoreReconciliationService.prepare')(function* (isClearingPendingWork: boolean) {
                    if (isClearingPendingWork) {
                        yield* resetRepository.clearPendingWork();
                    }

                    yield* recordRepository.invalidateAll();
                }),
                complete: Effect.fn('SyncRestoreReconciliationService.complete')(function* (
                    syncZone: string,
                    zoneInventory: ReadonlySet<string>
                ) {
                    const unconfirmed = (yield* recordRepository.findUnconfirmed()).filter(record => record.syncZone === syncZone);
                    const deletions: SyncIncomingDeletionInterface[] = [];
                    const results: SyncApplyResultInterface[] = [];

                    for (const { syncZone: zone, syncId, recordType } of unconfirmed) {
                        if (zoneInventory.has(syncId)) {
                            continue;
                        }

                        if (dataRecordTypes.has(recordType)) {
                            deletions.push({ recordType, recordName: syncId, zone });
                        } else {
                            yield* recordRepository.remove(zone, syncId);
                        }
                    }

                    for (let start = 0; start < deletions.length; start += deletionChunkSize) {
                        results.push(
                            yield* applyService.apply({ records: [], deletions: deletions.slice(start, start + deletionChunkSize) })
                        );
                        yield* YIELD_TO_UI;
                    }

                    yield* outboxRepository.enqueueUnrecorded(syncZone);

                    return results;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncRestoreReconciliationService, SyncRestoreReconciliationService.make).pipe(
        Layer.provide([SyncRecordRepository.layer, SyncOutboxRepository.layer, SyncResetRepository.layer])
    );
}
