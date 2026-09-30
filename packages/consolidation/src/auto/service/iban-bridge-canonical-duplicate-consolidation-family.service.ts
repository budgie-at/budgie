import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeCanonicalDuplicateCandidateInterface } from '@budgie/contracts';

export class IbanBridgeCanonicalDuplicateConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeCanonicalDuplicateCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE;

    constructor(
        private readonly ibanBridgeTransferRepository: IbanBridgeTransferRepository,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService
    ) {
        super();
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null) {
        return this.ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface) {
        return this.consolidationRepairExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }
}
