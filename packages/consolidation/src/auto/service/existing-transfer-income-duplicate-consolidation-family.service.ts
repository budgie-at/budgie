import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class ExistingTransferIncomeDuplicateConsolidationFamilyService extends Context.Service<ExistingTransferIncomeDuplicateConsolidationFamilyService>()(
    '@budgie/consolidation/ExistingTransferIncomeDuplicateConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            ExistingTransferRepository,
            ConsolidationRepairExecutorService,
            (existingTransferRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE,
                findCandidates: scope => existingTransferRepository.findIncomeDuplicateCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateExistingTransferIncomeDuplicate(candidate),
                getSourceTransactionIds: candidate => [candidate.existingTransferId, candidate.duplicateTransactionId]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        ExistingTransferIncomeDuplicateConsolidationFamilyService,
        ExistingTransferIncomeDuplicateConsolidationFamilyService.make
    ).pipe(Layer.provide([ExistingTransferRepository.layer, ConsolidationRepairExecutorService.layer]));
}
