import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

import type { ExistingTransferBridgeCandidateInterface } from '@budgie/contracts';

export class ExistingTransferBridgeConsolidationFamilyService extends Context.Service<ExistingTransferBridgeConsolidationFamilyService>()(
    '@budgie/consolidation/ExistingTransferBridgeConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            ExistingTransferRepository,
            ConsolidationExecutorService,
            (existingTransferRepository, consolidationExecutorService) => {
                const getSourceTransactionIds = (candidate: ExistingTransferBridgeCandidateInterface): number[] => [
                    candidate.sourceExpenseTransactionId,
                    candidate.bridgeIncomeTransactionId,
                    candidate.existingTransferId
                ];

                return {
                    key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE,
                    findCandidates: scope => existingTransferRepository.findBridgeCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateExistingTransferBridge(candidate, {
                            sourceTransactionIds: getSourceTransactionIds(candidate),
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
                        }),
                    getSourceTransactionIds
                };
            }
        )
    }
) {
    static readonly layer = Layer.effect(
        ExistingTransferBridgeConsolidationFamilyService,
        ExistingTransferBridgeConsolidationFamilyService.make
    ).pipe(Layer.provide([ExistingTransferRepository.layer, ConsolidationExecutorService.layer]));
}
