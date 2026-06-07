import { isDefined } from '@rnw-community/shared';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeTransferCandidateInterface } from '@budgie/contracts';

export class IbanBridgeTransferConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeTransferCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_TRANSFER;

    constructor(
        private readonly ibanBridgeTransferRepository: Pick<IbanBridgeTransferRepository, 'findTransferCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateIbanBridgeTransfer'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeTransferCandidateInterface[]> {
        return this.ibanBridgeTransferRepository.findTransferCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeTransferCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateIbanBridgeTransfer(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
    }
}
