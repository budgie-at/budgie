import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { ConsolidationScanScopeInterface, ExistingTransferBridgeCandidateInterface } from '@budgie/contracts';

export class ExistingTransferBridgeConsolidationFamilyService extends ConsolidationFamilyStrategyService<ExistingTransferBridgeCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE;

    constructor(
        private readonly existingTransferRepository: Pick<ExistingTransferRepository, 'findBridgeCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateExistingTransferBridge'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<ExistingTransferBridgeCandidateInterface[]> {
        return this.existingTransferRepository.findBridgeCandidates(scope);
    }

    protected consolidateCandidate(candidate: ExistingTransferBridgeCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateExistingTransferBridge(candidate, this.buildConsolidationPlan(candidate));
    }

    protected getSourceTransactionIds(candidate: ExistingTransferBridgeCandidateInterface): number[] {
        return [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId];
    }

    private buildConsolidationPlan(candidate: ExistingTransferBridgeCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.getSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [candidate.existingTransferId],
            canonicalInput: {
                title:
                    candidate.existingTransferTitle ??
                    candidate.sourceExpenseTransactionTitle ??
                    candidate.bridgeIncomeTransactionTitle ??
                    '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.targetAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.sourceExpenseEntryToIban
            }
        };
    }
}
