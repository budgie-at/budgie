import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type { ConsolidationFamilyBatchInterface } from '../interface/consolidation-family-batch.interface';

export class ConsolidationFamilyBatchBuilderService {
    constructor(
        private readonly consolidationExecutorService: ConsolidationExecutorService,
        private readonly processCandidates: <T>(candidates: T[], consolidate: (candidate: T) => Promise<boolean>) => Promise<number>
    ) {}

    buildBatches(candidates: ConsolidationCandidateGroupsInterface): ConsolidationFamilyBatchInterface[] {
        return [
            {
                key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                candidateCount: candidates.ibanBridgeChainTransferCandidates.length,
                process: () =>
                    this.processCandidates(candidates.ibanBridgeChainTransferCandidates, candidate =>
                        this.consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE,
                candidateCount: candidates.existingTransferBridgeCandidates.length,
                process: () =>
                    this.processCandidates(candidates.existingTransferBridgeCandidates, candidate =>
                        this.consolidationExecutorService.consolidateExistingTransferBridge(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_CHAIN_RECLAIM,
                candidateCount: candidates.existingTransferChainReclaimCandidates.length,
                process: () =>
                    this.processCandidates(candidates.existingTransferChainReclaimCandidates, candidate =>
                        this.consolidationExecutorService.consolidateExistingTransferChainReclaim(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE,
                candidateCount: candidates.ibanBridgeCanonicalDuplicateCandidates.length,
                process: () =>
                    this.processCandidates(candidates.ibanBridgeCanonicalDuplicateCandidates, candidate =>
                        this.consolidationExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_TRANSFER,
                candidateCount: candidates.ibanBridgeTransferCandidates.length,
                process: () =>
                    this.processCandidates(candidates.ibanBridgeTransferCandidates, candidate =>
                        this.consolidationExecutorService.consolidateIbanBridgeTransfer(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE,
                candidateCount: candidates.existingTransferIncomeDuplicateCandidates.length,
                process: () =>
                    this.processCandidates(candidates.existingTransferIncomeDuplicateCandidates, candidate =>
                        this.consolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.TRANSFER_PAIR,
                candidateCount: candidates.pairCandidates.length,
                process: () =>
                    this.processCandidates(candidates.pairCandidates, candidate =>
                        this.consolidationExecutorService.consolidatePair(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.ATM_CASH_WITHDRAWAL,
                candidateCount: candidates.atmCashWithdrawalCandidates.length,
                process: () =>
                    this.processCandidates(candidates.atmCashWithdrawalCandidates, candidate =>
                        this.consolidationExecutorService.consolidateAtmCashWithdrawal(candidate)
                    )
            },
            {
                key: ConsolidationFamilyKeyEnum.REFUND,
                candidateCount: candidates.refundCandidates.length,
                process: () =>
                    this.processCandidates(candidates.refundCandidates, candidate =>
                        this.consolidationExecutorService.consolidateRefund(candidate)
                    )
            }
        ];
    }

    countCandidates(candidates: ConsolidationCandidateGroupsInterface): number {
        return this.buildBatches(candidates).reduce((count, batch) => count + batch.candidateCount, 0);
    }
}
