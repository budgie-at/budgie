import { isDefined } from '@rnw-community/shared';

import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    IbanBridgeChainTransferCandidateInterface
} from '@budgie/contracts';

export class ConsolidationSourceTransactionSetService {
    buildBridgeSourceTransactionIdSet(
        candidateGroups: Pick<
            ConsolidationCandidateGroupsInterface,
            | 'ibanBridgeChainTransferCandidates'
            | 'existingTransferBridgeCandidates'
            | 'existingTransferChainReclaimCandidates'
            | 'ibanBridgeTransferCandidates'
            | 'existingTransferIncomeDuplicateCandidates'
        >
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(candidateGroups.ibanBridgeChainTransferCandidates);
        const existingTransferBridgeSourceTransactionIds = candidateGroups.existingTransferBridgeCandidates.flatMap(candidate => [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ]);
        const existingTransferChainReclaimSourceTransactionIds = candidateGroups.existingTransferChainReclaimCandidates.flatMap(
            candidate => [candidate.existingTransferId, candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId]
        );
        const bridgeSourceTransactionIds = candidateGroups.ibanBridgeTransferCandidates
            .flatMap(candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId, candidate.existingDirectTransferId])
            .filter(isDefined);
        const duplicateSourceTransactionIds = candidateGroups.existingTransferIncomeDuplicateCandidates.map(
            candidate => candidate.incomeTransactionId
        );
        const additionalSourceTransactionIds = [
            ...existingTransferBridgeSourceTransactionIds,
            ...existingTransferChainReclaimSourceTransactionIds,
            ...bridgeSourceTransactionIds,
            ...duplicateSourceTransactionIds
        ];

        for (const sourceTransactionId of additionalSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    buildBridgeTransferBlockedSourceTransactionIdSet(
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildExistingTransferBridgeSourceTransactionIdSet(candidates: ExistingTransferBridgeCandidateInterface[]): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.existingTransferId
            ])
        );
    }

    private buildExistingTransferChainReclaimSourceTransactionIdSet(
        candidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.existingTransferId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId
            ])
        );
    }

    private buildBridgeChainSourceTransactionIdSet(candidates: IbanBridgeChainTransferCandidateInterface[]): Set<number> {
        const sourceTransactionIds = new Set<number>();

        for (const candidate of candidates) {
            sourceTransactionIds.add(candidate.sourceExpenseTransactionId);
            sourceTransactionIds.add(candidate.bridgeIncomeTransactionId);
            sourceTransactionIds.add(candidate.bridgeExpenseTransactionId);
            sourceTransactionIds.add(candidate.targetIncomeTransactionId);
        }

        return sourceTransactionIds;
    }
}
