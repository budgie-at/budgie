import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class IbanBridgeCanonicalSupersessionConsolidationFamilyService extends Context.Service<IbanBridgeCanonicalSupersessionConsolidationFamilyService>()(
    '@budgie/consolidation/IbanBridgeCanonicalSupersessionConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            IbanBridgeTransferRepository,
            ConsolidationRepairExecutorService,
            (ibanBridgeTransferRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_SUPERSESSION,
                findCandidates: scope => ibanBridgeTransferRepository.findCanonicalSupersessionCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateIbanBridgeCanonicalSupersession(candidate),
                getSourceTransactionIds: candidate => [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId],
                getScopeTransactionIds: candidate => [
                    candidate.supersededCanonicalTransactionId,
                    candidate.canonicalTransactionId,
                    candidate.bridgeOriginTransactionId
                ]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        IbanBridgeCanonicalSupersessionConsolidationFamilyService,
        IbanBridgeCanonicalSupersessionConsolidationFamilyService.make
    ).pipe(Layer.provide([IbanBridgeTransferRepository.layer, ConsolidationRepairExecutorService.layer]));
}
