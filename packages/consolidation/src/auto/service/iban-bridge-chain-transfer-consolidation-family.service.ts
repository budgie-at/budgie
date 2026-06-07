import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { ConsolidationScanScopeInterface, IbanBridgeChainTransferCandidateInterface } from '@budgie/contracts';

export class IbanBridgeChainTransferConsolidationFamilyService extends ConsolidationFamilyStrategyService<IbanBridgeChainTransferCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CHAIN_TRANSFER;

    constructor(
        private readonly ibanBridgeTransferRepository: Pick<IbanBridgeTransferRepository, 'findChainTransferCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateIbanBridgeChainTransfer'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        return this.ibanBridgeTransferRepository.findChainTransferCandidates(scope);
    }

    protected consolidateCandidate(candidate: IbanBridgeChainTransferCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate);
    }

    protected getSourceTransactionIds(candidate: IbanBridgeChainTransferCandidateInterface): number[] {
        return [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];
    }
}
