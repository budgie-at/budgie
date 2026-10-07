import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService, LedgerWorkload } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ERSTE_DUPLICATE_CANDIDATE_SQL } from '../../erste/constant/erste-duplicate-candidate-sql.constant';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '../../privatbank/constant/privatbank-duplicate-candidate-sql.constant';
import { UnpairedOwnCardTransferRepairService } from '../../privatbank/service/unpaired-own-card-transfer-repair.service';

import { SyncDuplicateSoftDeleteService } from './sync-duplicate-soft-delete.service';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateRepairPreviewInterface } from '../interface/sync-duplicate-repair-preview.interface';
import type { SyncDuplicateRepairResultInterface } from '../interface/sync-duplicate-repair-result.interface';
import type { SyncDuplicateRepairSourcePreviewInterface } from '../interface/sync-duplicate-repair-source-preview.interface';

export class SyncRepairService extends Context.Service<SyncRepairService>()('@budgie/sync/SyncRepairService', {
    make: Effect.gen(function* () {
        const ledgerWorkload = yield* LedgerWorkload;
        const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const syncDuplicateSoftDeleteService = yield* SyncDuplicateSoftDeleteService;
        const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
        const exclusive = yield* Semaphore.make(1);
        const sources = [
            { externalSource: ExternalSourceEnum.PRIVATBANK, candidateSql: PRIVATBANK_DUPLICATE_CANDIDATE_SQL },
            { externalSource: ExternalSourceEnum.ERSTE, candidateSql: ERSTE_DUPLICATE_CANDIDATE_SQL }
        ] as const;

        const buildSourcePreview = (
            externalSource: ExternalSourceEnum,
            candidates: readonly SyncDuplicateCandidateRowInterface[]
        ): SyncDuplicateRepairSourcePreviewInterface => ({
            duplicateTransactionCount: candidates.filter(candidate => candidate.externalSource === externalSource).length,
            externalSource
        });

        const addConsolidationRepairPreview = (
            sourcePreviews: readonly SyncDuplicateRepairSourcePreviewInterface[],
            consolidationRepairCount: number
        ): SyncDuplicateRepairSourcePreviewInterface[] => {
            if (!isPositiveNumber(consolidationRepairCount)) {
                return [...sourcePreviews];
            }

            const privatbankSource = sourcePreviews.find(source => source.externalSource === ExternalSourceEnum.PRIVATBANK);

            if (!isDefined(privatbankSource)) {
                return [
                    ...sourcePreviews,
                    {
                        duplicateTransactionCount: consolidationRepairCount,
                        externalSource: ExternalSourceEnum.PRIVATBANK
                    }
                ];
            }

            return sourcePreviews.map(source => {
                if (source.externalSource !== ExternalSourceEnum.PRIVATBANK) {
                    return source;
                }

                return {
                    ...source,
                    duplicateTransactionCount: source.duplicateTransactionCount + consolidationRepairCount
                };
            });
        };

        const buildPreviewFromCandidates = (
            candidates: readonly SyncDuplicateCandidateRowInterface[],
            consolidationRepairCount = 0
        ): SyncDuplicateRepairPreviewInterface => {
            const duplicateSources = sources
                .map(({ externalSource }) => buildSourcePreview(externalSource, candidates))
                .filter(source => isPositiveNumber(source.duplicateTransactionCount));
            const sourcePreviews = addConsolidationRepairPreview(duplicateSources, consolidationRepairCount);
            const duplicateTransactionCount = sourcePreviews.reduce((total, source) => total + source.duplicateTransactionCount, 0);

            return { duplicateTransactionCount, sources: sourcePreviews };
        };

        const mergeConsolidationRepairResult = (
            result: SyncDuplicateRepairResultInterface,
            consolidationRepairCount: number
        ): SyncDuplicateRepairResultInterface => {
            if (!isPositiveNumber(consolidationRepairCount)) {
                return result;
            }

            return {
                repairedTransactionCount: result.repairedTransactionCount + consolidationRepairCount
            };
        };

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
            const ownCardTransferRepairCount = yield* unpairedOwnCardTransferRepairService.repair();

            return incomeDuplicateRepairCount + bridgeClaimRepairCount + missingTransferFeeRepairCount + ownCardTransferRepairCount;
        });

        const rebuildBalancesWhenNeeded = Effect.fnUntraced(function* (result: SyncDuplicateRepairResultInterface) {
            if (isPositiveNumber(result.repairedTransactionCount)) {
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }
        });

        const removeDuplicatesInTransaction = Effect.fnUntraced(function* () {
            const candidates = yield* findDuplicateCandidates();
            const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);
            const result = yield* syncDuplicateSoftDeleteService.remove(duplicateTransactionIds);

            return {
                repairedTransactionCount: result.updatedTransactionIds.length
            } satisfies SyncDuplicateRepairResultInterface;
        });

        const buildPreview = Effect.fnUntraced(function* () {
            const candidates = yield* findDuplicateCandidates();
            const consolidationRepairCount =
                (yield* consolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates()) +
                (yield* consolidationCoordinatorService.countBridgeClaimRepairCandidates()) +
                (yield* consolidationCoordinatorService.countMissingTransferFeeRepairCandidates()) +
                (yield* unpairedOwnCardTransferRepairService.countCandidates());

            return buildPreviewFromCandidates(candidates, consolidationRepairCount);
        });

        const removeDuplicatesInner = Effect.fnUntraced(function* () {
            const duplicateResult = yield* Db.transaction(removeDuplicatesInTransaction());
            const consolidationRepairCount = yield* repairConsolidationDuplicates().pipe(
                Effect.onError(() => Effect.ignoreCause(rebuildBalancesWhenNeeded(duplicateResult)))
            );
            const result = mergeConsolidationRepairResult(duplicateResult, consolidationRepairCount);

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
            SyncDuplicateSoftDeleteService.layer,
            UnpairedOwnCardTransferRepairService.layer
        ])
    );
}
