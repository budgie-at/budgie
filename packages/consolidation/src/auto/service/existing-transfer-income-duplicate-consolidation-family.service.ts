import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { ConsolidationScanScopeInterface, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ExistingTransferIncomeDuplicateConsolidationFamilyService extends ConsolidationFamilyStrategyService<ExistingTransferIncomeDuplicateCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE;

    constructor(
        private readonly existingTransferRepository: ExistingTransferRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null) {
        return this.existingTransferRepository.findIncomeDuplicateCandidates(scope);
    }

    protected consolidateCandidate(candidate: ExistingTransferIncomeDuplicateCandidateInterface) {
        return this.consolidationRepairExecutorService.consolidateExistingTransferIncomeDuplicate(candidate);
    }

    protected getSourceTransactionIds(candidate: ExistingTransferIncomeDuplicateCandidateInterface): number[] {
        return [candidate.existingTransferId, candidate.duplicateTransactionId];
    }
}
