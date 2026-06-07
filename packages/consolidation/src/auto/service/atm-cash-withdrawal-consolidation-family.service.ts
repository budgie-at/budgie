import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import type { AtmCashWithdrawalCandidateInterface, ConsolidationScanScopeInterface } from '@budgie/contracts';

export class AtmCashWithdrawalConsolidationFamilyService extends ConsolidationFamilyStrategyService<AtmCashWithdrawalCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.ATM_CASH_WITHDRAWAL;

    constructor(
        private readonly atmCashWithdrawalRepository: Pick<AtmCashWithdrawalRepository, 'findCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateAtmCashWithdrawal'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return this.atmCashWithdrawalRepository.findCandidates(scope);
    }

    protected consolidateCandidate(candidate: AtmCashWithdrawalCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateAtmCashWithdrawal(candidate, this.buildConsolidationPlan(candidate));
    }

    protected getSourceTransactionIds(candidate: AtmCashWithdrawalCandidateInterface): number[] {
        return [candidate.transactionId];
    }

    private buildConsolidationPlan(candidate: AtmCashWithdrawalCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.getSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.transactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetCashAccountId,
                fromAmount: candidate.amount,
                toAmount: candidate.amount,
                exchangeRate: 1,
                consolidationType: TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL,
                fromEntryExchangeRate: 1,
                toEntryExchangeRate: 1,
                fromEntryToIban: null
            }
        };
    }
}
