import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class IbanBridgeCanonicalDuplicateConsolidationFamilyService extends Context.Service<IbanBridgeCanonicalDuplicateConsolidationFamilyService>()(
    '@budgie/consolidation/IbanBridgeCanonicalDuplicateConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            IbanBridgeTransferRepository,
            ConsolidationRepairExecutorService,
            (ibanBridgeTransferRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE,
                findCandidates: scope => ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate),
                getSourceTransactionIds: candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        IbanBridgeCanonicalDuplicateConsolidationFamilyService,
        IbanBridgeCanonicalDuplicateConsolidationFamilyService.make
    ).pipe(Layer.provide([IbanBridgeTransferRepository.layer, ConsolidationRepairExecutorService.layer]));
}
