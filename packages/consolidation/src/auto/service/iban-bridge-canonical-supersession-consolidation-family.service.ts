import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeCanonicalSupersessionCandidateInterface } from '@budgie/contracts';

export class IbanBridgeCanonicalSupersessionConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeCanonicalSupersessionCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_SUPERSESSION;

    constructor(
        private readonly ibanBridgeTransferRepository: Pick<IbanBridgeTransferRepository, 'findCanonicalSupersessionCandidates'>,
        private readonly consolidationRepairExecutorService: Pick<
            ConsolidationRepairExecutorService,
            'consolidateIbanBridgeCanonicalSupersession'
        >,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeCanonicalSupersessionCandidateInterface[]> {
        return this.ibanBridgeTransferRepository.findCanonicalSupersessionCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeCanonicalSupersessionCandidateInterface): Promise<boolean> {
        return this.consolidationRepairExecutorService.consolidateIbanBridgeCanonicalSupersession(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeCanonicalSupersessionCandidateInterface): number[] {
        return [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId];
    }
}
