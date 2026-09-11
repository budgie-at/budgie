import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import type { BridgeClaimRepairCandidateInterface } from '@budgie/contracts';

export class BridgeClaimRepairConsolidationFamilyService extends ConsolidationFamilyStrategyService<BridgeClaimRepairCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.BRIDGE_CLAIM_REPAIR;

    constructor(
        private readonly transferPairRepository: Pick<TransferPairRepository, 'findBridgeClaimedRepairCandidates'>,
        private readonly consolidationRepairExecutorService: Pick<
            ConsolidationRepairExecutorService,
            'unconsolidateBridgeClaimedTransferPair'
        >,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(): Promise<BridgeClaimRepairCandidateInterface[]> {
        return this.transferPairRepository.findBridgeClaimedRepairCandidates();
    }

    protected consolidateCandidate(candidate: BridgeClaimRepairCandidateInterface): Promise<boolean> {
        return this.consolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair(candidate);
    }

    protected getSourceTransactionIds(candidate: BridgeClaimRepairCandidateInterface): number[] {
        return [candidate.canonicalTransferId, candidate.claimedIncomeTransactionId];
    }
}
