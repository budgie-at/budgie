import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { ConsolidationScanScopeInterface, RefundCandidateInterface } from '@budgie/contracts';

export class RefundPairConsolidationFamilyService extends ConsolidationFamilyStrategyService<RefundCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.REFUND;

    constructor(
        private readonly refundPairRepository: RefundPairRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService
    ) {
        super();
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null) {
        return this.refundPairRepository.findCandidates(scope);
    }

    protected consolidateCandidate(candidate: RefundCandidateInterface) {
        return this.consolidationRepairExecutorService.consolidateRefund(candidate);
    }

    protected getSourceTransactionIds(candidate: RefundCandidateInterface): number[] {
        return [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];
    }
}
