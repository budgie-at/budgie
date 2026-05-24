import { Log } from '@budgie/logger';

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

class TransferConsolidationAutoCandidateService {
    @Log(
        candidates =>
            `enter pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length}`,
        (result, candidates) =>
            `done pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} consolidated=${result}`,
        (error, candidates) =>
            `throw pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} error=${getErrorMessage(error)}`
    )
    async processGroups(candidates: ConsolidationCandidateGroupsInterface): Promise<number> {
        const bridgeChainConsolidated = await this.processIbanBridgeChainTransferCandidates(candidates.ibanBridgeChainTransferCandidates);
        const existingTransferBridgeConsolidated = await this.processExistingTransferBridgeCandidates(
            candidates.existingTransferBridgeCandidates
        );
        const bridgeDuplicateConsolidated = await this.processIbanBridgeCanonicalDuplicateCandidates(
            candidates.ibanBridgeCanonicalDuplicateCandidates
        );
        const bridgeConsolidated = await this.processIbanBridgeTransferCandidates(candidates.ibanBridgeTransferCandidates);
        const existingTransferIncomeDuplicateConsolidated = await this.processExistingTransferIncomeDuplicateCandidates(
            candidates.existingTransferIncomeDuplicateCandidates
        );
        const pairConsolidated = await this.processPairCandidates(candidates.pairCandidates);
        const atmConsolidated = await this.processAtmCashWithdrawalCandidates(candidates.atmCashWithdrawalCandidates);
        const refundConsolidated = await this.processRefundCandidates(candidates.refundCandidates);

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

    private async reduceConsolidations<T>(candidates: T[], consolidate: (candidate: T) => Promise<void>): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await consolidate(candidate).then(
                () => true,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }
}

export const transferConsolidationAutoCandidateService = new TransferConsolidationAutoCandidateService();
