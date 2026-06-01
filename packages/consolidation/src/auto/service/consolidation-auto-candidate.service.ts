import { Log } from '@budgie/logger';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
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

export class ConsolidationAutoCandidateService {
    constructor(private readonly consolidationExecutorService: ConsolidationExecutorService) {}

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

    @Log(
        candidates => `enter existingTransferIncomeDuplicateCount=${candidates.length}`,
        (result, candidates) => `done existingTransferIncomeDuplicateCount=${candidates.length} consolidated=${result}`,
        (error, candidates) => `throw existingTransferIncomeDuplicateCount=${candidates.length} error=${getErrorMessage(error)}`
    )
    async processExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate)
        );
    }

    private async processPairCandidates(candidates: TransferPairCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => this.consolidationExecutorService.consolidatePair(candidate));
    }

    private async processAtmCashWithdrawalCandidates(candidates: AtmCashWithdrawalCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateAtmCashWithdrawal(candidate)
        );
    }

    private async processIbanBridgeTransferCandidates(candidates: IbanBridgeTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateIbanBridgeTransfer(candidate)
        );
    }

    private async processIbanBridgeCanonicalDuplicateCandidates(
        candidates: IbanBridgeCanonicalDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate)
        );
    }

    private async processExistingTransferBridgeCandidates(candidates: ExistingTransferBridgeCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateExistingTransferBridge(candidate)
        );
    }

    private async processIbanBridgeChainTransferCandidates(candidates: IbanBridgeChainTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate)
        );
    }

    private async processRefundCandidates(candidates: RefundCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => this.consolidationExecutorService.consolidateRefund(candidate));
    }

    private async profileConsolidationBatch<T>(
        label: string,
        candidates: T[],
        processBatch: (entries: T[]) => Promise<number>,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        if (!isNotEmptyString(label)) {
            throw new Error('Consolidation batch label is required');
        }

        const consolidated = await processBatch(candidates);
        onProgress?.(candidates.length);

        return consolidated;
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
}
