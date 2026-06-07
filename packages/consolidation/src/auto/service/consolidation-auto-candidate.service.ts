import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { yieldToEventLoop } from '../utils/yield-to-event-loop.util';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationAutoCandidateService {
    constructor(
        private readonly consolidationExecutorService: ConsolidationExecutorService,
        private readonly yieldControl: () => Promise<void> = yieldToEventLoop
    ) {}

    @Log(
        (candidates, onProgress) =>
            `enter ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, candidates, onProgress) =>
            `done ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length} hasOnProgress=${String(isDefined(onProgress))} consolidated=${result}`,
        (error, candidates, onProgress) =>
            `throw ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
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
            candidates.ibanBridgeChainTransferCandidates,
            entries => this.processIbanBridgeChainTransferCandidates(entries),
            publishProgress
        );
        const existingTransferBridgeConsolidated = await this.profileConsolidationBatch(
            candidates.existingTransferBridgeCandidates,
            entries => this.processExistingTransferBridgeCandidates(entries),
            publishProgress
        );
        const existingTransferChainReclaimConsolidated = await this.profileConsolidationBatch(
            candidates.existingTransferChainReclaimCandidates,
            entries => this.processExistingTransferChainReclaimCandidates(entries),
            publishProgress
        );
        const bridgeDuplicateConsolidated = await this.profileConsolidationBatch(
            candidates.ibanBridgeCanonicalDuplicateCandidates,
            entries => this.processIbanBridgeCanonicalDuplicateCandidates(entries),
            publishProgress
        );
        const bridgeConsolidated = await this.profileConsolidationBatch(
            candidates.ibanBridgeTransferCandidates,
            entries => this.processIbanBridgeTransferCandidates(entries),
            publishProgress
        );
        const existingTransferIncomeDuplicateConsolidated = await this.profileConsolidationBatch(
            candidates.existingTransferIncomeDuplicateCandidates,
            entries => this.processExistingTransferIncomeDuplicateCandidates(entries),
            publishProgress
        );
        const pairConsolidated = await this.profileConsolidationBatch(
            candidates.pairCandidates,
            entries => this.processPairCandidates(entries),
            publishProgress
        );
        const atmConsolidated = await this.profileConsolidationBatch(
            candidates.atmCashWithdrawalCandidates,
            entries => this.processAtmCashWithdrawalCandidates(entries),
            publishProgress
        );
        const refundConsolidated = await this.profileConsolidationBatch(
            candidates.refundCandidates,
            entries => this.processRefundCandidates(entries),
            publishProgress
        );

        return (
            bridgeChainConsolidated +
            existingTransferBridgeConsolidated +
            existingTransferChainReclaimConsolidated +
            bridgeDuplicateConsolidated +
            bridgeConsolidated +
            existingTransferIncomeDuplicateConsolidated +
            pairConsolidated +
            atmConsolidated +
            refundConsolidated
        );
    }

    @Log(
        candidates =>
            `enter ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length}`,
        (result, candidates) =>
            `done ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length} count=${result}`,
        (error, candidates) =>
            `throw ibanBridgeChainCount=${candidates.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${candidates.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${candidates.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${candidates.ibanBridgeCanonicalDuplicateCandidates.length} ibanBridgeCount=${candidates.ibanBridgeTransferCandidates.length} existingTransferIncomeDuplicateCount=${candidates.existingTransferIncomeDuplicateCandidates.length} pairCount=${candidates.pairCandidates.length} atmCount=${candidates.atmCashWithdrawalCandidates.length} refundCount=${candidates.refundCandidates.length} error=${getErrorMessage(error)}`
    )
    countCandidates(candidates: ConsolidationCandidateGroupsInterface): number {
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

    private async processExistingTransferChainReclaimCandidates(
        candidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            this.consolidationExecutorService.consolidateExistingTransferChainReclaim(candidate)
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
        candidates: T[],
        processBatch: (entries: T[]) => Promise<number>,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<number> {
        if (candidates.length === 0) {
            onProgress?.(candidates.length);

            return 0;
        }

        await this.yieldControl();
        const consolidated = await processBatch(candidates);
        onProgress?.(candidates.length);
        await this.yieldControl();

        return consolidated;
    }

    private async reduceConsolidations<T>(candidates: T[], consolidate: (candidate: T) => Promise<boolean>): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            await this.yieldControl();
            const success = await consolidate(candidate).then(
                result => result,
                () => false
            );
            await this.yieldControl();

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }
}
