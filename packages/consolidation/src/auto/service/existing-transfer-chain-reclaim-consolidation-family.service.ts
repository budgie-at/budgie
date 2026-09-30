import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { ConsolidationScanScopeInterface, ExistingTransferChainReclaimCandidateInterface } from '@budgie/contracts';

export class ExistingTransferChainReclaimConsolidationFamilyService extends ConsolidationFamilyStrategyService<ExistingTransferChainReclaimCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_CHAIN_RECLAIM;

    constructor(
        private readonly existingTransferRepository: ExistingTransferRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService
    ) {
        super();
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null) {
        return this.existingTransferRepository.findChainReclaimCandidates(scope);
    }

    protected consolidateCandidate(candidate: ExistingTransferChainReclaimCandidateInterface) {
        return this.consolidationRepairExecutorService.consolidateExistingTransferChainReclaim(candidate);
    }

    protected getSourceTransactionIds(candidate: ExistingTransferChainReclaimCandidateInterface): number[] {
        return [candidate.existingTransferId, candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];
    }
}
