import { TransactionConsolidationTypeEnum, TransferPairAutoConfidenceBucketEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

import type { ConsolidationPlanInterface } from '../../executor/interface/consolidation-plan.interface';
import type { TransferPairCandidateInterface } from '@budgie/contracts';

export class TransferPairConsolidationFamilyService extends Context.Service<TransferPairConsolidationFamilyService>()(
    '@budgie/consolidation/TransferPairConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            TransferPairRepository,
            ConsolidationExecutorService,
            (transferPairRepository, consolidationExecutorService) => {
                const getSourceTransactionIds = (candidate: TransferPairCandidateInterface): number[] => [
                    candidate.expenseTransactionId,
                    candidate.incomeTransactionId
                ];

                const computeExchangeRate = (candidate: TransferPairCandidateInterface): number => {
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
                };

                const getConsolidationType = (candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum => {
                    if (candidate.confidenceBucket === TransferPairAutoConfidenceBucketEnum.AUTO_SAME_BANK_HINTED_FEE) {
                        return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
                    }

                    return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
                };

                const buildConsolidationPlan = (candidate: TransferPairCandidateInterface): ConsolidationPlanInterface => ({
                    sourceTransactionIds: getSourceTransactionIds(candidate),
                    allowedMovedSourceTransactionIds: [],
                    canonicalInput: {
                        title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                        operatedAt: candidate.operatedAt,
                        fromAccountId: candidate.expenseEntryAccountId,
                        toAccountId: candidate.incomeEntryAccountId,
                        fromAmount: candidate.expenseEntryAmount,
                        toAmount: candidate.incomeEntryAmount,
                        exchangeRate: computeExchangeRate(candidate),
                        consolidationType: getConsolidationType(candidate),
                        fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
                        toEntryExchangeRate: candidate.incomeEntryExchangeRate,
                        fromEntryToIban: candidate.expenseEntryToIban
                    }
                });

                return {
                    key: ConsolidationFamilyKeyEnum.TRANSFER_PAIR,
                    findCandidates: scope => transferPairRepository.findCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidatePair(candidate, buildConsolidationPlan(candidate)),
                    getSourceTransactionIds
                };
            }
        )
    }
) {
    static readonly layer = Layer.effect(TransferPairConsolidationFamilyService, TransferPairConsolidationFamilyService.make).pipe(
        Layer.provide([TransferPairRepository.layer, ConsolidationExecutorService.layer])
    );
}
