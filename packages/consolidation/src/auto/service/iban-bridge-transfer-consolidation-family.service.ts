import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
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
        return this.consolidationExecutorService.consolidateIbanBridgeTransfer(candidate, this.buildConsolidationPlan(candidate));
    }

    protected getSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }

    private buildConsolidationPlan(candidate: IbanBridgeTransferCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.getSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.bridgeAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.expenseEntryToIban
            }
        };
    }
}
