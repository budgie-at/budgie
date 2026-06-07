import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import type { ConsolidationScanScopeInterface, TransferPairCandidateInterface } from '@budgie/contracts';

export class TransferPairConsolidationFamilyService extends ConsolidationFamilyStrategyService<TransferPairCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.TRANSFER_PAIR;

    constructor(
        private readonly transferPairRepository: Pick<TransferPairRepository, 'findCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidatePair'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<TransferPairCandidateInterface[]> {
        return this.transferPairRepository.findCandidates(scope);
    }

    protected consolidateCandidate(candidate: TransferPairCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidatePair(candidate);
    }

    protected getSourceTransactionIds(candidate: TransferPairCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }
}
