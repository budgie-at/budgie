import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { ManualExpenseDuplicateRepository } from '../../query/repository/manual-expense-duplicate.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class ManualExpenseDuplicateConsolidationFamilyService extends Context.Service<ManualExpenseDuplicateConsolidationFamilyService>()(
    '@budgie/consolidation/ManualExpenseDuplicateConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            ManualExpenseDuplicateRepository,
            ConsolidationRepairExecutorService,
            (manualExpenseDuplicateRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.MANUAL_EXPENSE_DUPLICATE,
                findCandidates: scope => manualExpenseDuplicateRepository.findCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateManualExpenseDuplicate(candidate),
                getSourceTransactionIds: candidate => [candidate.syncedTransactionId, candidate.manualTransactionId]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        ManualExpenseDuplicateConsolidationFamilyService,
        ManualExpenseDuplicateConsolidationFamilyService.make
    ).pipe(Layer.provide([ManualExpenseDuplicateRepository.layer, ConsolidationRepairExecutorService.layer]));
}
