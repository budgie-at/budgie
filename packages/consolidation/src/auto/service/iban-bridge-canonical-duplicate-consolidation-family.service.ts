import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeCanonicalDuplicateCandidateInterface } from '@budgie/contracts';

export class IbanBridgeCanonicalDuplicateConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeCanonicalDuplicateCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE;

    constructor(
        private readonly ibanBridgeTransferRepository: Pick<IbanBridgeTransferRepository, 'findCanonicalDuplicateCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateIbanBridgeCanonicalDuplicate'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        return this.ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }
}
