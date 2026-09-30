import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import type { BridgeClaimRepairCandidateInterface } from '@budgie/contracts';

export class BridgeClaimRepairConsolidationFamilyService extends ConsolidationFamilyStrategyService<BridgeClaimRepairCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.BRIDGE_CLAIM_REPAIR;

    constructor(
        private readonly transferPairRepository: TransferPairRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService
    ) {
        super();
    }

    protected findCandidates() {
        return this.transferPairRepository.findBridgeClaimedRepairCandidates();
    }

    protected consolidateCandidate(candidate: BridgeClaimRepairCandidateInterface) {
        return this.consolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair(candidate);
    }

    protected getSourceTransactionIds(candidate: BridgeClaimRepairCandidateInterface): number[] {
        return [candidate.canonicalTransferId, candidate.claimedIncomeTransactionId];
    }
}
