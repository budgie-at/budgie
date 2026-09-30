import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class RefundPairConsolidationFamilyService extends Context.Service<RefundPairConsolidationFamilyService>()(
    '@budgie/consolidation/RefundPairConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            RefundPairRepository,
            ConsolidationRepairExecutorService,
            (refundPairRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.REFUND,
                findCandidates: scope => refundPairRepository.findCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateRefund(candidate),
                getSourceTransactionIds: candidate => [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds]
            })
        )
    }
) {
    static readonly layer = Layer.effect(RefundPairConsolidationFamilyService, RefundPairConsolidationFamilyService.make).pipe(
        Layer.provide([RefundPairRepository.layer, ConsolidationRepairExecutorService.layer])
    );
}
