import { Db, ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { Workload } from '../../@generic/service/workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';
import { ersteDuplicateRepairSourceService, privatbankDuplicateRepairSourceService } from './sync-duplicate-repair-source.service';
import { syncDuplicateSoftDeleteService } from './sync-duplicate-soft-delete.service';
import { unpairedOwnCardTransferRepairService } from './unpaired-own-card-transfer-repair.service';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateRepairPreviewInterface } from '../interface/sync-duplicate-repair-preview.interface';
import type { SyncDuplicateRepairResultInterface } from '../interface/sync-duplicate-repair-result.interface';
import type { SyncDuplicateRepairSourcePreviewInterface } from '../interface/sync-duplicate-repair-source-preview.interface';
import type { SyncDuplicateRepairSourceStrategyInterface } from '../interface/sync-duplicate-repair-source-strategy.interface';

class SyncRepairService {
    private static readonly SOURCE_STRATEGIES: readonly SyncDuplicateRepairSourceStrategyInterface[] = [
        privatbankDuplicateRepairSourceService,
        ersteDuplicateRepairSourceService
    ];

    readonly previewDuplicates = Effect.fn('SyncRepairService.previewDuplicates')(function* (this: SyncRepairService) {
        return yield* this.exclusive.withPermit(this.buildPreview());
    });

    readonly removeDuplicates = Effect.fn('SyncRepairService.removeDuplicates')(function* (this: SyncRepairService) {
        return yield* this.exclusive.withPermit(Workload.use(workload => workload.runForeground(this.removeDuplicatesInner())));
    }, invalidateDatabaseLiveQuery);

    private readonly findDuplicateCandidates = Effect.fnUntraced(function* () {
        const candidateGroups = yield* Effect.all(SyncRepairService.SOURCE_STRATEGIES.map(strategy => strategy.findDuplicateCandidates()));

        return candidateGroups.flat();
    });

    private readonly repairConsolidationDuplicates = Effect.fnUntraced(function* () {
        const incomeDuplicateRepairCount = yield* consolidationCoordinatorService.repairExistingTransferIncomeDuplicates();
        const bridgeClaimRepairCount = yield* consolidationCoordinatorService.repairBridgeClaimedTransferPairs();
        const ownCardTransferRepairCount = yield* unpairedOwnCardTransferRepairService.repair();

        return incomeDuplicateRepairCount + bridgeClaimRepairCount + ownCardTransferRepairCount;
    });

    private readonly rebuildBalancesWhenNeeded = Effect.fnUntraced(function* (result: SyncDuplicateRepairResultInterface) {
        if (isPositiveNumber(result.repairedTransactionCount)) {
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        }
    });

    private readonly removeDuplicatesInTransaction = Effect.fnUntraced(function* (this: SyncRepairService) {
        const candidates = yield* this.findDuplicateCandidates();
        const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);
        const result = yield* syncDuplicateSoftDeleteService.remove(duplicateTransactionIds);

        return {
            repairedTransactionCount: result.updatedTransactionIds.length
        } satisfies SyncDuplicateRepairResultInterface;
    });

    private readonly buildPreview = Effect.fnUntraced(function* (this: SyncRepairService) {
        const candidates = yield* this.findDuplicateCandidates();
        const consolidationRepairCount =
            (yield* consolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates()) +
            (yield* consolidationCoordinatorService.countBridgeClaimRepairCandidates()) +
            (yield* unpairedOwnCardTransferRepairService.countCandidates());

        return this.buildPreviewFromCandidates(candidates, consolidationRepairCount);
    });

    private readonly exclusive = Semaphore.makeUnsafe(1);

    private readonly removeDuplicatesInner = Effect.fnUntraced(function* (this: SyncRepairService) {
        const duplicateResult = yield* Db.transaction(this.removeDuplicatesInTransaction());
        const consolidationRepairCount = yield* this.repairConsolidationDuplicates().pipe(
            Effect.tapError(() => Effect.ignore(this.rebuildBalancesWhenNeeded(duplicateResult)))
        );
        const result = this.mergeConsolidationRepairResult(duplicateResult, consolidationRepairCount);

        yield* this.rebuildBalancesWhenNeeded(result);

        return result;
    });

    private buildPreviewFromCandidates(
        candidates: readonly SyncDuplicateCandidateRowInterface[],
        consolidationRepairCount = 0
    ): SyncDuplicateRepairPreviewInterface {
        const duplicateSources = SyncRepairService.SOURCE_STRATEGIES.map(source => this.buildSourcePreview(source, candidates)).filter(
            source => isPositiveNumber(source.duplicateTransactionCount)
        );
        const sources = this.addConsolidationRepairPreview(duplicateSources, consolidationRepairCount);
        const duplicateTransactionCount = sources.reduce((total, source) => total + source.duplicateTransactionCount, 0);

        return { duplicateTransactionCount, sources };
    }

    private addConsolidationRepairPreview(
        sources: readonly SyncDuplicateRepairSourcePreviewInterface[],
        consolidationRepairCount: number
    ): SyncDuplicateRepairSourcePreviewInterface[] {
        if (!isPositiveNumber(consolidationRepairCount)) {
            return [...sources];
        }

        const privatbankSource = sources.find(source => source.externalSource === ExternalSourceEnum.PRIVATBANK);

        if (!isDefined(privatbankSource)) {
            return [
                ...sources,
                {
                    duplicateTransactionCount: consolidationRepairCount,
                    externalSource: ExternalSourceEnum.PRIVATBANK
                }
            ];
        }

        return sources.map(source => {
            if (source.externalSource !== ExternalSourceEnum.PRIVATBANK) {
                return source;
            }

            return {
                ...source,
                duplicateTransactionCount: source.duplicateTransactionCount + consolidationRepairCount
            };
        });
    }

    private buildSourcePreview(
        source: SyncDuplicateRepairSourceStrategyInterface,
        candidates: readonly SyncDuplicateCandidateRowInterface[]
    ): SyncDuplicateRepairSourcePreviewInterface {
        const sourceCandidates = candidates.filter(candidate => candidate.externalSource === source.externalSource);

        return {
            duplicateTransactionCount: sourceCandidates.length,
            externalSource: source.externalSource
        };
    }

    private mergeConsolidationRepairResult(
        result: SyncDuplicateRepairResultInterface,
        consolidationRepairCount: number
    ): SyncDuplicateRepairResultInterface {
        if (!isPositiveNumber(consolidationRepairCount)) {
            return result;
        }

        return {
            repairedTransactionCount: result.repairedTransactionCount + consolidationRepairCount
        };
    }
}

export const syncRepairService = new SyncRepairService();
