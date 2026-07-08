import { TransactionConsolidationTypeEnum, TransferPairAutoConfidenceBucketEnum } from '@budgie/contracts';

import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import type { ConsolidationScanScopeInterface, TransferPairCandidateInterface } from '@budgie/contracts';

export class TransferPairConsolidationFamilyService extends ConsolidationFamilyStrategyService<TransferPairCandidateInterface> {
    readonly key = ConsolidationFamilyKeyEnum.TRANSFER_PAIR;

    constructor(
        private readonly transferPairRepository: Pick<TransferPairRepository, 'findCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidatePair'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<TransferPairCandidateInterface[]> {
        return this.transferPairRepository.findCandidates(scope);
    }

    protected consolidateCandidate(candidate: TransferPairCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidatePair(candidate, this.buildConsolidationPlan(candidate));
    }

    protected getSourceTransactionIds(candidate: TransferPairCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }

    private buildConsolidationPlan(candidate: TransferPairCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.getSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.expenseEntryAccountId,
                toAccountId: candidate.incomeEntryAccountId,
                fromAmount: candidate.expenseEntryAmount,
                toAmount: candidate.incomeEntryAmount,
                exchangeRate: this.computeExchangeRate(candidate),
                consolidationType: this.getConsolidationType(candidate),
                fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
                toEntryExchangeRate: candidate.incomeEntryExchangeRate,
                fromEntryToIban: candidate.expenseEntryToIban
            }
        };
    }

    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (
            candidate.confidenceBucket === TransferPairAutoConfidenceBucketEnum.AUTO_SAME_BANK_HINTED_FEE ||
            candidate.confidenceBucket === TransferPairAutoConfidenceBucketEnum.AUTO_INTERBANK_HINTED_FEE
        ) {
            return 1;
        }

        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    private getConsolidationType(candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum {
        if (candidate.confidenceBucket === TransferPairAutoConfidenceBucketEnum.AUTO_SAME_BANK_HINTED_FEE) {
            return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
        }

        return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
    }
}
