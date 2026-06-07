import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

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
        return this.consolidationExecutorService.consolidateAtmCashWithdrawal(candidate);
    }

    protected getSourceTransactionIds(candidate: AtmCashWithdrawalCandidateInterface): number[] {
        return [candidate.transactionId];
    }
}
