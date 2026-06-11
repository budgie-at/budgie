import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
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
        return this.consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate, this.buildConsolidationPlan(candidate));
    }

    protected getSourceTransactionIds(candidate: IbanBridgeChainTransferCandidateInterface): number[] {
        return [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];
    }

    private buildConsolidationPlan(candidate: IbanBridgeChainTransferCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.getSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title:
                    candidate.bridgeExpenseTransactionTitle ??
                    candidate.sourceExpenseTransactionTitle ??
                    candidate.targetIncomeTransactionTitle ??
                    candidate.bridgeIncomeTransactionTitle ??
                    '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.targetAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.sourceExpenseEntryToIban
            }
        };
    }
}
