import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

import type { IbanBridgeTransferCandidateInterface } from '@budgie/contracts';

export class IbanBridgeTransferConsolidationFamilyService extends Context.Service<IbanBridgeTransferConsolidationFamilyService>()(
    '@budgie/consolidation/IbanBridgeTransferConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            IbanBridgeTransferRepository,
            ConsolidationExecutorService,
            (ibanBridgeTransferRepository, consolidationExecutorService) => {
                const getSourceTransactionIds = (candidate: IbanBridgeTransferCandidateInterface): number[] => [
                    candidate.expenseTransactionId,
                    candidate.incomeTransactionId
                ];

                return {
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_TRANSFER,
                    findCandidates: scope => ibanBridgeTransferRepository.findTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateIbanBridgeTransfer(candidate, {
                            sourceTransactionIds: getSourceTransactionIds(candidate),
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
                        }),
                    getSourceTransactionIds
                };
            }
        )
    }
) {
    static readonly layer = Layer.effect(
        IbanBridgeTransferConsolidationFamilyService,
        IbanBridgeTransferConsolidationFamilyService.make
    ).pipe(Layer.provide([IbanBridgeTransferRepository.layer, ConsolidationExecutorService.layer]));
}
