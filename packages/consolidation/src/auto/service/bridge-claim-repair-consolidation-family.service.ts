import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class BridgeClaimRepairConsolidationFamilyService extends Context.Service<BridgeClaimRepairConsolidationFamilyService>()(
    '@budgie/consolidation/BridgeClaimRepairConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            TransferPairRepository,
            ConsolidationRepairExecutorService,
            (transferPairRepository, consolidationRepairExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.BRIDGE_CLAIM_REPAIR,
                findCandidates: _scope => transferPairRepository.findBridgeClaimedRepairCandidates(),
                consolidateCandidate: candidate => consolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair(candidate),
                getSourceTransactionIds: candidate => [candidate.canonicalTransferId, candidate.claimedIncomeTransactionId]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        BridgeClaimRepairConsolidationFamilyService,
        BridgeClaimRepairConsolidationFamilyService.make
    ).pipe(Layer.provide([TransferPairRepository.layer, ConsolidationRepairExecutorService.layer]));
}
