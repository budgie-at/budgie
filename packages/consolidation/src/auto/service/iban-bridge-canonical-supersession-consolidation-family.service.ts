import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeCanonicalSupersessionCandidateInterface } from '@budgie/contracts';

export class IbanBridgeCanonicalSupersessionConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeCanonicalSupersessionCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_SUPERSESSION;

    constructor(
        private readonly ibanBridgeTransferRepository: IbanBridgeTransferRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService
    ) {
        super();
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null) {
        return this.ibanBridgeTransferRepository.findCanonicalSupersessionCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeCanonicalSupersessionCandidateInterface) {
        return this.consolidationRepairExecutorService.consolidateIbanBridgeCanonicalSupersession(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeCanonicalSupersessionCandidateInterface): number[] {
        return [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId];
    }

    protected override getScopeTransactionIds(candidate: IbanBridgeCanonicalSupersessionCandidateInterface): number[] {
        return [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId, candidate.bridgeOriginTransactionId];
    }
}
