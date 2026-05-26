import { Log, getLogger } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { transferConsolidationExecutorService } from './transfer-consolidation-executor.service';

import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

const logger = getLogger('TransferConsolidationAutoCandidateService');

class TransferConsolidationAutoCandidateService {
    @Log(
        candidates =>
            `enter pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length}`,
        (result, candidates) =>
            `done pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} consolidated=${result}`,
        (error, candidates) =>
            `throw pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} error=${getErrorMessage(error)}`
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
        const bridgeChainConsolidated = await this.profileConsolidationBatch(
            'ibanBridgeChain',
            candidates.ibanBridgeChainTransferCandidates,
            entries => this.processIbanBridgeChainTransferCandidates(entries),
            publishProgress
        );
        const existingTransferBridgeConsolidated = await this.profileConsolidationBatch(
            'existingTransferBridge',
            candidates.existingTransferBridgeCandidates,
            entries => this.processExistingTransferBridgeCandidates(entries),
            publishProgress
        );
        const bridgeDuplicateConsolidated = await this.profileConsolidationBatch(
            'ibanBridgeDuplicate',
            candidates.ibanBridgeCanonicalDuplicateCandidates,
            entries => this.processIbanBridgeCanonicalDuplicateCandidates(entries),
            publishProgress
        );
        const bridgeConsolidated = await this.profileConsolidationBatch(
            'ibanBridge',
            candidates.ibanBridgeTransferCandidates,
            entries => this.processIbanBridgeTransferCandidates(entries),
            publishProgress
        );
        const existingTransferIncomeDuplicateConsolidated = await this.profileConsolidationBatch(
            'existingTransferIncomeDuplicate',
            candidates.existingTransferIncomeDuplicateCandidates,
            entries => this.processExistingTransferIncomeDuplicateCandidates(entries),
            publishProgress
        );
        const pairConsolidated = await this.profileConsolidationBatch(
            'pair',
            candidates.pairCandidates,
            entries => this.processPairCandidates(entries),
            publishProgress
        );
        const atmConsolidated = await this.profileConsolidationBatch(
            'atm',
            candidates.atmCashWithdrawalCandidates,
            entries => this.processAtmCashWithdrawalCandidates(entries),
            publishProgress
        );
        const refundConsolidated = await this.profileConsolidationBatch(
            'refund',
            candidates.refundCandidates,
            entries => this.processRefundCandidates(entries),
            publishProgress
        );

        return (
            bridgeChainConsolidated +
            existingTransferBridgeConsolidated +
            bridgeDuplicateConsolidated +
            pairConsolidated +
            bridgeConsolidated +
            existingTransferIncomeDuplicateConsolidated +
            atmConsolidated +
            refundConsolidated
        );
    }

    private async processPairCandidates(candidates: TransferPairCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => transferConsolidationExecutorService.consolidatePair(candidate));
    }

    private async processAtmCashWithdrawalCandidates(candidates: AtmCashWithdrawalCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateAtmCashWithdrawal(candidate)
        );
    }

    private async processIbanBridgeTransferCandidates(candidates: IbanBridgeTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeTransfer(candidate)
        );
    }

    private async processIbanBridgeCanonicalDuplicateCandidates(
        candidates: IbanBridgeCanonicalDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate)
        );
    }

    private async processExistingTransferBridgeCandidates(candidates: ExistingTransferBridgeCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateExistingTransferBridge(candidate)
        );
    }

    private async processExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate)
        );
    }

    private async processIbanBridgeChainTransferCandidates(candidates: IbanBridgeChainTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate)
        );
    }

    private async processRefundCandidates(candidates: RefundCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => transferConsolidationExecutorService.consolidateRefund(candidate));
    }

    private async reduceConsolidations<T>(candidates: T[], consolidate: (candidate: T) => Promise<boolean>): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await consolidate(candidate).then(
                result => result,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    private async profileConsolidationBatch<T>(
        label: string,
        candidates: T[],
        processBatch: (entries: T[]) => Promise<number>,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        const startedAt = Date.now();
        const consolidated = await processBatch(candidates);
        onProgress?.(candidates.length);
        logger.log('batch:duration', { label, count: candidates.length, consolidated, durationMs: Date.now() - startedAt });

        return consolidated;
    }
}

export const transferConsolidationAutoCandidateService = new TransferConsolidationAutoCandidateService();
