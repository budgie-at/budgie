import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ConsolidationFamilyBatchBuilderService } from './consolidation-family-batch-builder.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type { ConsolidationFamilyBatchInterface } from '../interface/consolidation-family-batch.interface';
import type { ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ConsolidationAutoCandidateService {
    private static readonly YIELD_EVERY_CANDIDATES = 10;

    private readonly consolidationFamilyBatchBuilderService: ConsolidationFamilyBatchBuilderService;

    constructor(
        private readonly consolidationExecutorService: ConsolidationExecutorService,
        private readonly yieldControl: () => Promise<void>
    ) {
        this.consolidationFamilyBatchBuilderService = new ConsolidationFamilyBatchBuilderService(
            consolidationExecutorService,
            (candidates, consolidate) => this.processCandidates(candidates, consolidate)
        );
    }

    @Log(
        (candidates, onProgress) =>
            `enter candidateCount=${ConsolidationAutoCandidateService.countCandidateGroupItems(candidates)} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, candidates, onProgress) =>
            `done candidateCount=${ConsolidationAutoCandidateService.countCandidateGroupItems(candidates)} hasOnProgress=${String(isDefined(onProgress))} consolidated=${result}`,
        (error, candidates, onProgress) =>
            `throw candidateCount=${ConsolidationAutoCandidateService.countCandidateGroupItems(candidates)} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async processGroups(
        candidates: ConsolidationCandidateGroupsInterface,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        let processedCandidateGroupCount = 0;
        const publishProgress = (processedCount: number) => {
            processedCandidateGroupCount += processedCount;
            onProgress?.(processedCandidateGroupCount);
        };

        return this.processFamilyBatches(this.consolidationFamilyBatchBuilderService.buildBatches(candidates), publishProgress);
    }

    @Log(
        candidates => `enter existingTransferIncomeDuplicateCount=${candidates.length}`,
        (result, candidates) => `done existingTransferIncomeDuplicateCount=${candidates.length} consolidated=${result}`,
        (error, candidates) => `throw existingTransferIncomeDuplicateCount=${candidates.length} error=${getErrorMessage(error)}`
    )
    async processExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.processCandidates(candidates, candidate =>
            this.consolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate)
        );
    }

    countCandidates(candidates: ConsolidationCandidateGroupsInterface): number {
        return this.consolidationFamilyBatchBuilderService.countCandidates(candidates);
    }

    private async processFamilyBatches(
        batches: ConsolidationFamilyBatchInterface[],
        onProgress: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        return batches.reduce(async (consolidatedPromise, batch) => {
            const consolidated = await consolidatedPromise;
            const familyConsolidated = await this.profileConsolidationBatch(batch, onProgress);

            return consolidated + familyConsolidated;
        }, Promise.resolve(0));
    }

    private async profileConsolidationBatch(
        batch: ConsolidationFamilyBatchInterface,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        if (batch.candidateCount === 0) {
            onProgress?.(batch.candidateCount);

            return 0;
        }

        await this.yieldControl();
        const consolidated = await batch.process();
        onProgress?.(batch.candidateCount);
        await this.yieldControl();

        return consolidated;
    }

    private async processCandidates<T>(candidates: T[], consolidate: (candidate: T) => Promise<boolean>): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate, candidateIndex) => {
            const consolidated = await consolidatedPromise;
            const success = await consolidate(candidate).then(
                result => result,
                () => false
            );
            await this.yieldBetweenCandidates(candidateIndex, candidates.length);

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    private async yieldBetweenCandidates(candidateIndex: number, candidateCount: number): Promise<void> {
        const processedCandidateCount = candidateIndex + 1;
        const hasMoreCandidates = processedCandidateCount < candidateCount;

        if (hasMoreCandidates && processedCandidateCount % ConsolidationAutoCandidateService.YIELD_EVERY_CANDIDATES === 0) {
            await this.yieldControl();
        }
    }

    private static countCandidateGroupItems(candidates: ConsolidationCandidateGroupsInterface): number {
        return (
            candidates.ibanBridgeChainTransferCandidates.length +
            candidates.existingTransferBridgeCandidates.length +
            candidates.existingTransferChainReclaimCandidates.length +
            candidates.ibanBridgeCanonicalDuplicateCandidates.length +
            candidates.ibanBridgeTransferCandidates.length +
            candidates.existingTransferIncomeDuplicateCandidates.length +
            candidates.pairCandidates.length +
            candidates.atmCashWithdrawalCandidates.length +
            candidates.refundCandidates.length
        );
    }
}
