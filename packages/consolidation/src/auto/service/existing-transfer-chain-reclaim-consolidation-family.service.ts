import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class ExistingTransferChainReclaimConsolidationFamilyService extends Context.Service<ExistingTransferChainReclaimConsolidationFamilyService>()(
    '@budgie/consolidation/ExistingTransferChainReclaimConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            ExistingTransferRepository,
            ConsolidationRepairExecutorService,
            (existingTransferRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_CHAIN_RECLAIM,
                findCandidates: scope => existingTransferRepository.findChainReclaimCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateExistingTransferChainReclaim(candidate),
                getSourceTransactionIds: candidate => [
                    candidate.existingTransferId,
                    candidate.bridgeIncomeTransactionId,
                    candidate.bridgeExpenseTransactionId
                ]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        ExistingTransferChainReclaimConsolidationFamilyService,
        ExistingTransferChainReclaimConsolidationFamilyService.make
    ).pipe(Layer.provide([ExistingTransferRepository.layer, ConsolidationRepairExecutorService.layer]));
}
