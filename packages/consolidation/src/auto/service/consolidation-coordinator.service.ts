import { TransactionConsolidationTypeEnum, TransferPairAutoConfidenceBucketEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { ConsolidationMutationService } from '../../executor/service/consolidation-mutation.service';
import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { buildIbanBridgeChainCanonicalInput } from '../../executor/utils/build-iban-bridge-chain-canonical-input.util';
import { ConsolidationCandidateRepository } from '../../query/repository/consolidation-candidate.repository';
import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';
import { makeConsolidationFamilyStrategy } from '../utils/make-consolidation-family-strategy.util';

import { P2pFiatTransferConsolidationFamilyService } from './p2p-fiat-transfer-consolidation-family.service';

import type { FeeEntrySourceInterface } from '../../query/interface/fee-entry-source.interface';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCoordinatorService extends Context.Service<ConsolidationCoordinatorService>()(
    '@budgie/consolidation/ConsolidationCoordinatorService',
    {
        make: Effect.gen(function* () {
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const refundPairRepository = yield* RefundPairRepository;
            const consolidationExecutorService = yield* ConsolidationExecutorService;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const p2pFiatTransferFamily = yield* P2pFiatTransferConsolidationFamilyService;

            const getIbanBridgeChainTransferSourceTransactionIds = (candidate: IbanBridgeChainTransferCandidateInterface): number[] => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId,
                candidate.targetIncomeTransactionId
            ];

            const getExistingTransferBridgeSourceTransactionIds = (candidate: ExistingTransferBridgeCandidateInterface): number[] => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.existingTransferId
            ];

            const getExistingTransferChainReclaimSourceTransactionIds = (
                candidate: ExistingTransferChainReclaimCandidateInterface
            ): number[] => [candidate.existingTransferId, candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];

            const getIbanBridgeTransferSourceTransactionIds = (candidate: IbanBridgeTransferCandidateInterface): number[] => [
                candidate.expenseTransactionId,
                candidate.incomeTransactionId
            ];

            const getTransferPairSourceTransactionIds = (candidate: TransferPairCandidateInterface): number[] => [
                candidate.expenseTransactionId,
                candidate.incomeTransactionId
            ];

            const computeTransferPairExchangeRate = (candidate: TransferPairCandidateInterface): number => {
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

            const getTransferPairConsolidationType = (candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum => {
                if (candidate.confidenceBucket === TransferPairAutoConfidenceBucketEnum.AUTO_SAME_BANK_HINTED_FEE) {
                    return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
                }

                return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
            };

            const existingTransferIncomeDuplicateFamily = makeConsolidationFamilyStrategy({
                findCandidates: scope => consolidationCandidateRepository.findExistingTransferIncomeDuplicateCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateExistingTransferIncomeDuplicate(candidate),
                getSourceTransactionIds: candidate => [candidate.existingTransferId, candidate.duplicateTransactionId]
            });

            const families: ConsolidationFamilyStrategyInterface[] = [
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeChainTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateTransfer({
                            sourceTransactionIds: getIbanBridgeChainTransferSourceTransactionIds(candidate),
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
                    getSourceTransactionIds: getIbanBridgeChainTransferSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findExistingTransferBridgeCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateTransfer({
                            sourceTransactionIds: getExistingTransferBridgeSourceTransactionIds(candidate),
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
                    getSourceTransactionIds: getExistingTransferBridgeSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findExistingTransferChainReclaimCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationRepairExecutorService.consolidateExistingTransferChainReclaim(candidate),
                    getSourceTransactionIds: getExistingTransferChainReclaimSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeCanonicalDuplicateCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationRepairExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate),
                    getSourceTransactionIds: candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId]
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateTransfer({
                            sourceTransactionIds: getIbanBridgeTransferSourceTransactionIds(candidate),
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
                    getSourceTransactionIds: getIbanBridgeTransferSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeDuplicatePairCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateIbanBridgeDuplicatePair(candidate),
                    getSourceTransactionIds: candidate => [
                        candidate.pairTransactionId,
                        candidate.sourceExpenseTransactionId,
                        candidate.targetIncomeTransactionId
                    ],
                    getScopeTransactionIds: candidate => [
                        candidate.pairTransactionId,
                        candidate.bridgeTransactionId,
                        candidate.sourceExpenseTransactionId,
                        candidate.targetIncomeTransactionId
                    ]
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeEndLegCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateIbanBridgeEndLeg(candidate),
                    getSourceTransactionIds: candidate => [candidate.endLegTransactionId],
                    getScopeTransactionIds: candidate => [
                        candidate.endLegTransactionId,
                        candidate.canonicalTransactionId,
                        candidate.bridgeOriginTransactionId
                    ]
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findIbanBridgeCanonicalSupersessionCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationRepairExecutorService.consolidateIbanBridgeCanonicalSupersession(candidate),
                    getSourceTransactionIds: candidate => [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId],
                    getScopeTransactionIds: candidate => [
                        candidate.supersededCanonicalTransactionId,
                        candidate.canonicalTransactionId,
                        candidate.bridgeOriginTransactionId
                    ]
                }),
                existingTransferIncomeDuplicateFamily,
                p2pFiatTransferFamily,
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findTransferPairCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateTransfer({
                            sourceTransactionIds: getTransferPairSourceTransactionIds(candidate),
                            allowedMovedSourceTransactionIds: [],
                            canonicalInput: {
                                title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                                operatedAt: candidate.operatedAt,
                                fromAccountId: candidate.expenseEntryAccountId,
                                toAccountId: candidate.incomeEntryAccountId,
                                fromAmount: candidate.expenseEntryAmount,
                                toAmount: candidate.incomeEntryAmount,
                                exchangeRate: computeTransferPairExchangeRate(candidate),
                                consolidationType: getTransferPairConsolidationType(candidate),
                                fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
                                toEntryExchangeRate: candidate.incomeEntryExchangeRate,
                                fromEntryToIban: candidate.expenseEntryToIban
                            }
                        }),
                    getSourceTransactionIds: getTransferPairSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => refundPairRepository.findCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateRefund(candidate),
                    getSourceTransactionIds: candidate => [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds]
                }),
                makeConsolidationFamilyStrategy({
                    findCandidates: scope => consolidationCandidateRepository.findManualExpenseDuplicateCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateManualExpenseDuplicate(candidate),
                    getSourceTransactionIds: candidate => [candidate.syncedTransactionId, candidate.manualTransactionId]
                })
            ];

            const bridgeClaimRepairFamily = makeConsolidationFamilyStrategy({
                findCandidates: () => consolidationCandidateRepository.findBridgeClaimedRepairCandidates(),
                consolidateCandidate: candidate => consolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair(candidate),
                getSourceTransactionIds: candidate => [candidate.canonicalTransferId, candidate.claimedIncomeTransactionId]
            });

            const atmCashWithdrawalFamily = makeConsolidationFamilyStrategy({
                findCandidates: scope => consolidationCandidateRepository.findAtmCashWithdrawalCandidates(scope),
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
            });

            const findExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
                'ConsolidationCoordinatorService.findExistingTransferIncomeDuplicateRepairCandidates'
            )(function* () {
                const existingTransferBridgeCandidates = yield* consolidationCandidateRepository.findExistingTransferBridgeCandidates(null);
                yield* CONSOLIDATION_YIELD;
                const existingTransferChainReclaimCandidates =
                    yield* consolidationCandidateRepository.findExistingTransferChainReclaimCandidates(null);
                yield* CONSOLIDATION_YIELD;
                const rawExistingTransferIncomeDuplicateCandidates =
                    yield* consolidationCandidateRepository.findExistingTransferIncomeDuplicateCandidates(null);
                yield* CONSOLIDATION_YIELD;

                const blockedSourceTransactionIds = new Set([
                    ...existingTransferBridgeCandidates.flatMap(getExistingTransferBridgeSourceTransactionIds),
                    ...existingTransferChainReclaimCandidates.flatMap(getExistingTransferChainReclaimSourceTransactionIds)
                ]);
                const existingTransferIncomeDuplicateCandidates = rawExistingTransferIncomeDuplicateCandidates.filter(
                    candidate =>
                        !blockedSourceTransactionIds.has(candidate.existingTransferId) &&
                        !blockedSourceTransactionIds.has(candidate.duplicateTransactionId)
                );
                yield* CONSOLIDATION_YIELD;

                return existingTransferIncomeDuplicateCandidates;
            });

            const countCanonicals = (movedFeeEntries: readonly FeeEntrySourceInterface[]): number =>
                new Set(movedFeeEntries.map(feeEntry => feeEntry.transactionId)).size;

            const findBridgeClaimedRepairCandidates = Effect.fn('ConsolidationCoordinatorService.findBridgeClaimedRepairCandidates')(
                function* () {
                    const candidates = yield* consolidationCandidateRepository.findBridgeClaimedRepairCandidates();
                    yield* CONSOLIDATION_YIELD;

                    return candidates;
                }
            );

            const findAtmCashWithdrawalCandidates = Effect.fn('ConsolidationCoordinatorService.findAtmCashWithdrawalCandidates')(function* (
                transactionIds: readonly number[]
            ) {
                const candidates = yield* consolidationCandidateRepository.findAtmCashWithdrawalCandidates(null);

                return candidates.filter(candidate => transactionIds.includes(candidate.transactionId));
            });

            const consolidate = Effect.fn('ConsolidationCoordinatorService.consolidate')(function* (
                scope: ConsolidationScanScopeInterface | null = null,
                onProgress?: (processedCandidateGroupCount: number) => void
            ) {
                const blockedSourceTransactionIds = new Set<number>();
                let consolidated = 0;
                let found = 0;

                for (const family of families) {
                    const processedCandidateGroupCount = found;
                    const familyResult = yield* family.process({
                        blockedSourceTransactionIds: new Set(blockedSourceTransactionIds),
                        onProgress: processedCount => onProgress?.(processedCandidateGroupCount + processedCount),
                        scope
                    });

                    for (const sourceTransactionId of familyResult.blockedSourceTransactionIds) {
                        blockedSourceTransactionIds.add(sourceTransactionId);
                    }

                    consolidated += familyResult.consolidated;
                    found += familyResult.found;
                }

                return { found, consolidated } satisfies ConsolidationResultInterface;
            });

            return {
                consolidate,
                countAutoCandidates: Effect.fn('ConsolidationCoordinatorService.countAutoCandidates')(function* (
                    scope: ConsolidationScanScopeInterface | null = null
                ) {
                    const blockedSourceTransactionIds = new Set<number>();
                    let found = 0;

                    for (const family of families) {
                        const preview = yield* family.preview({ blockedSourceTransactionIds: new Set(blockedSourceTransactionIds), scope });

                        for (const sourceTransactionId of preview.blockedSourceTransactionIds) {
                            blockedSourceTransactionIds.add(sourceTransactionId);
                        }

                        found += preview.found;
                    }

                    return found;
                }),
                countManualReviewCandidates: Effect.fn('ConsolidationCoordinatorService.countManualReviewCandidates')(function* () {
                    const [manualReviewCandidateCount, refundReviewCandidates] = yield* Effect.all(
                        [
                            consolidationCandidateRepository.countTransferPairManualReviewCandidates(),
                            refundPairRepository.findReviewCandidates()
                        ],
                        { concurrency: 'unbounded' }
                    );
                    yield* CONSOLIDATION_YIELD;

                    return manualReviewCandidateCount + refundReviewCandidates.length;
                }),
                findAtmCashWithdrawalTransactionIds: Effect.fn('ConsolidationCoordinatorService.findAtmCashWithdrawalTransactionIds')(
                    function* (transactionIds: readonly number[]) {
                        const candidates = yield* findAtmCashWithdrawalCandidates(transactionIds);

                        return candidates.map(candidate => candidate.transactionId);
                    }
                ),
                moveAtmCashWithdrawalsToCash: Effect.fn('ConsolidationCoordinatorService.moveAtmCashWithdrawalsToCash')(function* (
                    transactionIds: readonly number[]
                ) {
                    const candidates = yield* findAtmCashWithdrawalCandidates(transactionIds);

                    return yield* atmCashWithdrawalFamily.processCandidateList(candidates);
                }),
                countExistingTransferIncomeDuplicateRepairCandidates: Effect.fn(
                    'ConsolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates'
                )(function* () {
                    return (yield* findExistingTransferIncomeDuplicateRepairCandidates()).length;
                }),
                repairExistingTransferIncomeDuplicates: Effect.fn('ConsolidationCoordinatorService.repairExistingTransferIncomeDuplicates')(
                    function* () {
                        const candidates = yield* findExistingTransferIncomeDuplicateRepairCandidates();

                        return yield* existingTransferIncomeDuplicateFamily.processCandidateList(candidates);
                    }
                ),
                countBridgeClaimRepairCandidates: Effect.fn('ConsolidationCoordinatorService.countBridgeClaimRepairCandidates')(
                    function* () {
                        return (yield* findBridgeClaimedRepairCandidates()).length;
                    }
                ),
                countMissingTransferFeeRepairCandidates: Effect.fn(
                    'ConsolidationCoordinatorService.countMissingTransferFeeRepairCandidates'
                )(function* () {
                    return countCanonicals(yield* consolidationCandidateRepository.findMissingTransferFeeEntries());
                }),
                repairMissingTransferFees: Effect.fn('ConsolidationCoordinatorService.repairMissingTransferFees')(function* () {
                    const movedFeeEntries = yield* consolidationCandidateRepository.findMissingTransferFeeEntries();

                    yield* consolidationMutationService.restoreMovedFeeEntries(movedFeeEntries);

                    return countCanonicals(movedFeeEntries);
                }),
                repairBridgeClaimedTransferPairs: Effect.fn('ConsolidationCoordinatorService.repairBridgeClaimedTransferPairs')(
                    function* () {
                        const candidates = yield* findBridgeClaimedRepairCandidates();
                        const repairedCount = yield* bridgeClaimRepairFamily.processCandidateList(candidates);

                        if (repairedCount > 0) {
                            yield* consolidate(null);
                        }

                        return repairedCount;
                    }
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationCoordinatorService, ConsolidationCoordinatorService.make).pipe(
        Layer.provide([
            ConsolidationCandidateRepository.layer,
            RefundPairRepository.layer,
            ConsolidationExecutorService.layer,
            ConsolidationMutationService.layer,
            ConsolidationRepairExecutorService.layer,
            P2pFiatTransferConsolidationFamilyService.layer
        ])
    );
}
