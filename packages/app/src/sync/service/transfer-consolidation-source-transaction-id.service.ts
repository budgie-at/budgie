import { isDefined } from '@rnw-community/shared';

import type {
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface
} from '@budgie/contracts';

class TransferConsolidationSourceTransactionIdService {
    buildBridgeSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
    }

    buildExistingTransferBridgeSourceTransactionIds(candidate: ExistingTransferBridgeCandidateInterface): number[] {
        return [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId];
    }

    buildBridgeChainSourceTransactionIds(candidate: IbanBridgeChainTransferCandidateInterface): number[] {
        return [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];
    }

    buildBridgeSourceTransactionIdSet(
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[],
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        bridgeCandidates: IbanBridgeTransferCandidateInterface[],
        existingTransferIncomeDuplicateCandidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);

        for (const candidate of existingTransferBridgeCandidates) {
            for (const transactionId of this.buildExistingTransferBridgeSourceTransactionIds(candidate)) {
                sourceTransactionIds.add(transactionId);
            }
        }

        for (const candidate of bridgeCandidates) {
            for (const transactionId of this.buildBridgeSourceTransactionIds(candidate)) {
                sourceTransactionIds.add(transactionId);
            }
        }

        for (const candidate of existingTransferIncomeDuplicateCandidates) {
            sourceTransactionIds.add(candidate.incomeTransactionId);
        }

        return sourceTransactionIds;
    }

    buildExistingTransferBridgeSourceTransactionIdSet(candidates: ExistingTransferBridgeCandidateInterface[]): Set<number> {
        const sourceTransactionIds = new Set<number>();

        for (const candidate of candidates) {
            for (const transactionId of this.buildExistingTransferBridgeSourceTransactionIds(candidate)) {
                sourceTransactionIds.add(transactionId);
            }
        }

        return sourceTransactionIds;
    }

    buildBridgeChainSourceTransactionIdSet(candidates: IbanBridgeChainTransferCandidateInterface[]): Set<number> {
        const sourceTransactionIds = new Set<number>();

        for (const candidate of candidates) {
            for (const transactionId of this.buildBridgeChainSourceTransactionIds(candidate)) {
                sourceTransactionIds.add(transactionId);
            }
        }

        return sourceTransactionIds;
    }
}

export const transferConsolidationSourceTransactionIdService = new TransferConsolidationSourceTransactionIdService();
