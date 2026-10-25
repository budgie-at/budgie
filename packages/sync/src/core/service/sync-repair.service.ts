import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService, LedgerWorkload } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { ERSTE_DUPLICATE_CANDIDATE_SQL } from '../../erste/constant/erste-duplicate-candidate-sql.constant';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '../../privatbank/constant/privatbank-duplicate-candidate-sql.constant';
import { UnpairedOwnCardTransferRepairService } from '../../privatbank/service/unpaired-own-card-transfer-repair.service';

import { ExternalAccountService } from './external-account.service';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateRepairPreviewInterface } from '../interface/sync-duplicate-repair-preview.interface';
import type { SyncDuplicateRepairResultInterface } from '../interface/sync-duplicate-repair-result.interface';

export class SyncRepairService extends Context.Service<SyncRepairService>()('@budgie/sync/SyncRepairService', {
    make: Effect.gen(function* () {
        const ledgerWorkload = yield* LedgerWorkload;
        const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
        const externalAccountService = yield* ExternalAccountService;
        const exclusive = yield* Semaphore.make(1);
        const sources = [
            { externalSource: ExternalSourceEnum.PRIVATBANK, candidateSql: PRIVATBANK_DUPLICATE_CANDIDATE_SQL },
            { externalSource: ExternalSourceEnum.ERSTE, candidateSql: ERSTE_DUPLICATE_CANDIDATE_SQL }
        ] as const;

        const sqliteBatchSize = 500;

        const buildPlaceholders = (ids: readonly number[]): string => ids.map(() => '?').join(',');

        const buildPreviewFromCandidates = (
            candidates: readonly SyncDuplicateCandidateRowInterface[],
            consolidationRepairCount: number
        ): SyncDuplicateRepairPreviewInterface => {
            const sourceCounts: ReadonlyArray<readonly [ExternalSourceEnum, number]> = [
                ...candidates.map(candidate => [candidate.externalSource, 1] as const),
                [ExternalSourceEnum.PRIVATBANK, consolidationRepairCount]
            ];
            const countBySource = sourceCounts.reduce(
                (counts, [externalSource, count]) =>
                    isPositiveNumber(count) ? counts.set(externalSource, (counts.get(externalSource) ?? 0) + count) : counts,
                new Map<ExternalSourceEnum, number>()
            );

            return {
                duplicateTransactionCount: candidates.length + consolidationRepairCount,
                sources: [...countBySource].map(([externalSource, duplicateTransactionCount]) => ({
                    externalSource,
                    duplicateTransactionCount
                }))
            };
        };

        const softDeleteChunk = Effect.fnUntraced(function* (chunk: readonly number[]) {
            const rows = yield* Db.query(db =>
                db.$client.unsafe<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
                    String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND id IN (${buildPlaceholders(chunk)}) RETURNING id AS duplicateTransactionId`,
                    [...chunk]
                )
            );
            const updatedIds = rows.map(row => row.duplicateTransactionId);

            if (isNotEmptyArray(updatedIds)) {
                yield* Db.query(
                    db =>
                        db.$client.unsafe(
                            String.raw`UPDATE transaction_entries SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND transaction_id IN (${buildPlaceholders(updatedIds)})`,
                            updatedIds
                        ).raw
                );
                yield* Db.query(
                    db =>
                        db.$client.unsafe(
                            String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IN (${buildPlaceholders(updatedIds)})`,
                            updatedIds
                        ).raw
                );
            }

            return updatedIds;
        });

        const findDuplicateCandidates = Effect.fnUntraced(function* () {
            const candidateGroups = yield* Effect.all(
                sources.map(({ candidateSql }) => Db.query(db => db.$client.unsafe<SyncDuplicateCandidateRowInterface>(candidateSql)))
            );

            return candidateGroups.flat();
        });

        const repairConsolidationDuplicates = Effect.fnUntraced(function* () {
            const incomeDuplicateRepairCount = yield* consolidationCoordinatorService.repairExistingTransferIncomeDuplicates();
            const bridgeClaimRepairCount = yield* consolidationCoordinatorService.repairBridgeClaimedTransferPairs();
            const missingTransferFeeRepairCount = yield* consolidationCoordinatorService.repairMissingTransferFees();
            const externalAccountRepairCount = yield* externalAccountService.repair();
            const ownCardTransferRepairCount = yield* unpairedOwnCardTransferRepairService.repair();

            return (
                incomeDuplicateRepairCount +
                bridgeClaimRepairCount +
                missingTransferFeeRepairCount +
                externalAccountRepairCount +
                ownCardTransferRepairCount
            );
        });

        const rebuildBalancesWhenNeeded = Effect.fnUntraced(function* (result: SyncDuplicateRepairResultInterface) {
            if (isPositiveNumber(result.repairedTransactionCount)) {
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }
        });

        const removeDuplicatesInTransaction = Effect.fnUntraced(function* () {
            const duplicateTransactionIds = (yield* findDuplicateCandidates()).map(candidate => candidate.duplicateTransactionId);
            let repairedTransactionCount = 0;

            for (let index = 0; index < duplicateTransactionIds.length; index += sqliteBatchSize) {
                repairedTransactionCount += (yield* Db.mutation(
                    { type: 'update', tables: ['transactions', 'transaction_entries'] },
                    softDeleteChunk(duplicateTransactionIds.slice(index, index + sqliteBatchSize))
                )).length;
            }

            return { repairedTransactionCount } satisfies SyncDuplicateRepairResultInterface;
        });

        const buildPreview = Effect.fnUntraced(function* () {
            const candidates = yield* findDuplicateCandidates();
            const consolidationRepairCount =
                (yield* consolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates()) +
                (yield* consolidationCoordinatorService.countBridgeClaimRepairCandidates()) +
                (yield* consolidationCoordinatorService.countMissingTransferFeeRepairCandidates()) +
                (yield* externalAccountService.countCandidates()) +
                (yield* unpairedOwnCardTransferRepairService.countCandidates());

            return buildPreviewFromCandidates(candidates, consolidationRepairCount);
        });

        const removeDuplicatesInner = Effect.fnUntraced(function* () {
            const duplicateResult = yield* Db.transaction(removeDuplicatesInTransaction());
            const consolidationRepairCount = yield* repairConsolidationDuplicates().pipe(
                Effect.onError(() => Effect.ignoreCause(rebuildBalancesWhenNeeded(duplicateResult)))
            );
            const result = {
                repairedTransactionCount: duplicateResult.repairedTransactionCount + consolidationRepairCount
            } satisfies SyncDuplicateRepairResultInterface;

            yield* rebuildBalancesWhenNeeded(result);

            return result;
        });

        return {
            previewDuplicates: Effect.fn('SyncRepairService.previewDuplicates')(function* () {
                return yield* exclusive.withPermit(buildPreview());
            }),
            removeDuplicates: Effect.fn('SyncRepairService.removeDuplicates')(function* () {
                return yield* exclusive.withPermit(ledgerWorkload.runForeground(removeDuplicatesInner()));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncRepairService, SyncRepairService.make).pipe(
        Layer.provide([
            ConsolidationCoordinatorService.layer,
            AccountBalanceIncrementalService.layer,
            UnpairedOwnCardTransferRepairService.layer,
            ExternalAccountService.layer
        ])
    );
}
