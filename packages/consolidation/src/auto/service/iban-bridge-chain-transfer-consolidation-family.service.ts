import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { buildIbanBridgeChainCanonicalInput } from '../../executor/utils/build-iban-bridge-chain-canonical-input.util';
import { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyService } from '../utils/make-consolidation-family-service.util';

import type { IbanBridgeChainTransferCandidateInterface } from '@budgie/contracts';

export class IbanBridgeChainTransferConsolidationFamilyService extends Context.Service<IbanBridgeChainTransferConsolidationFamilyService>()(
    '@budgie/consolidation/IbanBridgeChainTransferConsolidationFamilyService',
    {
        make: makeConsolidationFamilyService(
            IbanBridgeTransferRepository,
            ConsolidationExecutorService,
            (ibanBridgeTransferRepository, consolidationExecutorService) => {
                const getSourceTransactionIds = (candidate: IbanBridgeChainTransferCandidateInterface): number[] => [
                    candidate.sourceExpenseTransactionId,
                    candidate.bridgeIncomeTransactionId,
                    candidate.bridgeExpenseTransactionId,
                    candidate.targetIncomeTransactionId
                ];

                return {
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                    findCandidates: scope => ibanBridgeTransferRepository.findChainTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate, {
                            sourceTransactionIds: getSourceTransactionIds(candidate),
                            allowedMovedSourceTransactionIds: [],
                            canonicalInput: buildIbanBridgeChainCanonicalInput({
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
                                fromEntryToIban: candidate.sourceExpenseEntryToIban
                            })
                        }),
                    getSourceTransactionIds
                };
            }
        )
    }
) {
    static readonly layer = Layer.effect(
        IbanBridgeChainTransferConsolidationFamilyService,
        IbanBridgeChainTransferConsolidationFamilyService.make
    ).pipe(Layer.provide([IbanBridgeTransferRepository.layer, ConsolidationExecutorService.layer]));
}
