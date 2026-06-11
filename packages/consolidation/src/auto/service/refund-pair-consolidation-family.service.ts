import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { ConsolidationScanScopeInterface, RefundCandidateInterface } from '@budgie/contracts';

export class RefundPairConsolidationFamilyService extends ConsolidationFamilyStrategyService<RefundCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.REFUND;

    constructor(
        private readonly refundPairRepository: Pick<RefundPairRepository, 'findCandidates'>,
        private readonly consolidationRepairExecutorService: Pick<ConsolidationRepairExecutorService, 'consolidateRefund'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<RefundCandidateInterface[]> {
        return this.refundPairRepository.findCandidates(scope);
    }

    protected consolidateCandidate(candidate: RefundCandidateInterface): Promise<boolean> {
        return this.consolidationRepairExecutorService.consolidateRefund(candidate);
    }

    protected getSourceTransactionIds(candidate: RefundCandidateInterface): number[] {
        return [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];
    }
}
