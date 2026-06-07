import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { ConsolidationScanScopeInterface, ExistingTransferBridgeCandidateInterface } from '@budgie/contracts';

export class ExistingTransferBridgeConsolidationFamilyService extends ConsolidationFamilyStrategyService<ExistingTransferBridgeCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE;

    constructor(
        private readonly existingTransferRepository: Pick<ExistingTransferRepository, 'findBridgeCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateExistingTransferBridge'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<ExistingTransferBridgeCandidateInterface[]> {
        return this.existingTransferRepository.findBridgeCandidates(scope);
    }

    protected consolidateCandidate(candidate: ExistingTransferBridgeCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateExistingTransferBridge(candidate);
    }

    protected getSourceTransactionIds(candidate: ExistingTransferBridgeCandidateInterface): number[] {
        return [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId];
    }
}
