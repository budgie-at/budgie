import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { ConsolidationScanScopeInterface, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ExistingTransferIncomeDuplicateConsolidationFamilyService extends ConsolidationFamilyStrategyService<ExistingTransferIncomeDuplicateCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE;

    constructor(
        private readonly existingTransferRepository: Pick<ExistingTransferRepository, 'findIncomeDuplicateCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateExistingTransferIncomeDuplicate'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        return this.existingTransferRepository.findIncomeDuplicateCandidates(scope);
    }

    protected consolidateCandidate(candidate: ExistingTransferIncomeDuplicateCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate);
    }

    protected getSourceTransactionIds(candidate: ExistingTransferIncomeDuplicateCandidateInterface): number[] {
        return [candidate.existingTransferId, candidate.incomeTransactionId];
    }
}
