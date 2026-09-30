import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

export class AtmCashWithdrawalConsolidationFamilyService extends Context.Service<AtmCashWithdrawalConsolidationFamilyService>()(
    '@budgie/consolidation/AtmCashWithdrawalConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            AtmCashWithdrawalRepository,
            ConsolidationExecutorService,
            (atmCashWithdrawalRepository, consolidationExecutorService) => ({
                key: ConsolidationFamilyKeyEnum.ATM_CASH_WITHDRAWAL,
                findCandidates: scope => atmCashWithdrawalRepository.findCandidates(scope),
                consolidateCandidate: candidate =>
                    consolidationExecutorService.consolidateAtmCashWithdrawal(candidate, {
                        sourceTransactionIds: [candidate.transactionId],
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
                    }),
                getSourceTransactionIds: candidate => [candidate.transactionId]
            })
        )
    }
) {
    static readonly layer = Layer.effect(
        AtmCashWithdrawalConsolidationFamilyService,
        AtmCashWithdrawalConsolidationFamilyService.make
    ).pipe(Layer.provide([AtmCashWithdrawalRepository.layer, ConsolidationExecutorService.layer]));
}
