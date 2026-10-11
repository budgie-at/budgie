import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { ConsolidationMutationService } from '../../executor/service/consolidation-mutation.service';
import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { buildIbanBridgeChainCanonicalInput } from '../../executor/utils/build-iban-bridge-chain-canonical-input.util';
import { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import { ManualExpenseDuplicateRepository } from '../../query/repository/manual-expense-duplicate.repository';
import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { makeConsolidationFamilyStrategy } from '../utils/make-consolidation-family-strategy.util';

import { P2pFiatTransferConsolidationFamilyService } from './p2p-fiat-transfer-consolidation-family.service';
import { TransferPairConsolidationFamilyService } from './transfer-pair-consolidation-family.service';

import type { FeeEntrySourceInterface } from '../../query/interface/fee-entry-source.interface';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCoordinatorService extends Context.Service<ConsolidationCoordinatorService>()(
    '@budgie/consolidation/ConsolidationCoordinatorService',
    {
        make: Effect.gen(function* () {
            const atmCashWithdrawalRepository = yield* AtmCashWithdrawalRepository;
            const existingTransferRepository = yield* ExistingTransferRepository;
            const ibanBridgeTransferRepository = yield* IbanBridgeTransferRepository;
            const manualExpenseDuplicateRepository = yield* ManualExpenseDuplicateRepository;
            const refundPairRepository = yield* RefundPairRepository;
            const transferPairRepository = yield* TransferPairRepository;
            const consolidationExecutorService = yield* ConsolidationExecutorService;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const p2pFiatTransferFamily = yield* P2pFiatTransferConsolidationFamilyService;
            const transferPairFamily = yield* TransferPairConsolidationFamilyService;

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

            const existingTransferIncomeDuplicateFamily = makeConsolidationFamilyStrategy({
                key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_INCOME_DUPLICATE,
                findCandidates: scope => existingTransferRepository.findIncomeDuplicateCandidates(scope),
                consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateExistingTransferIncomeDuplicate(candidate),
                getSourceTransactionIds: candidate => [candidate.existingTransferId, candidate.duplicateTransactionId]
            });

            const families: ConsolidationFamilyStrategyInterface[] = [
                makeConsolidationFamilyStrategy({
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                    findCandidates: scope => ibanBridgeTransferRepository.findChainTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate, {
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
                    key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_BRIDGE,
                    findCandidates: scope => existingTransferRepository.findBridgeCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateExistingTransferBridge(candidate, {
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
                    key: ConsolidationFamilyKeyEnum.EXISTING_TRANSFER_CHAIN_RECLAIM,
                    findCandidates: scope => existingTransferRepository.findChainReclaimCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationRepairExecutorService.consolidateExistingTransferChainReclaim(candidate),
                    getSourceTransactionIds: getExistingTransferChainReclaimSourceTransactionIds
                }),
                makeConsolidationFamilyStrategy({
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE,
                    findCandidates: scope => ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationRepairExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate),
                    getSourceTransactionIds: candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId]
                }),
                makeConsolidationFamilyStrategy({
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_TRANSFER,
                    findCandidates: scope => ibanBridgeTransferRepository.findTransferCandidates(scope),
                    consolidateCandidate: candidate =>
                        consolidationExecutorService.consolidateIbanBridgeTransfer(candidate, {
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
                    key: ConsolidationFamilyKeyEnum.IBAN_BRIDGE_CANONICAL_SUPERSESSION,
                    findCandidates: scope => ibanBridgeTransferRepository.findCanonicalSupersessionCandidates(scope),
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
                transferPairFamily,
                makeConsolidationFamilyStrategy({
                    key: ConsolidationFamilyKeyEnum.REFUND,
                    findCandidates: scope => refundPairRepository.findCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateRefund(candidate),
                    getSourceTransactionIds: candidate => [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds]
                }),
                makeConsolidationFamilyStrategy({
                    key: ConsolidationFamilyKeyEnum.MANUAL_EXPENSE_DUPLICATE,
                    findCandidates: scope => manualExpenseDuplicateRepository.findCandidates(scope),
                    consolidateCandidate: candidate => consolidationRepairExecutorService.consolidateManualExpenseDuplicate(candidate),
                    getSourceTransactionIds: candidate => [candidate.syncedTransactionId, candidate.manualTransactionId]
                })
            ];

            const bridgeClaimRepairFamily = makeConsolidationFamilyStrategy({
                key: ConsolidationFamilyKeyEnum.BRIDGE_CLAIM_REPAIR,
                findCandidates: () => transferPairRepository.findBridgeClaimedRepairCandidates(),
                consolidateCandidate: candidate => consolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair(candidate),
                getSourceTransactionIds: candidate => [candidate.canonicalTransferId, candidate.claimedIncomeTransactionId]
            });

            const atmCashWithdrawalFamily = makeConsolidationFamilyStrategy({
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
            });

            const buildExistingTransferDuplicateBlockedSourceTransactionIdSet = (
                existingTransferBridgeCandidates: readonly ExistingTransferBridgeCandidateInterface[],
                existingTransferChainReclaimCandidates: readonly ExistingTransferChainReclaimCandidateInterface[]
            ): Set<number> =>
                new Set([
                    ...existingTransferBridgeCandidates.flatMap(getExistingTransferBridgeSourceTransactionIds),
                    ...existingTransferChainReclaimCandidates.flatMap(getExistingTransferChainReclaimSourceTransactionIds)
                ]);

            const findExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
                'ConsolidationCoordinatorService.findExistingTransferIncomeDuplicateRepairCandidates'
            )(function* () {
                const existingTransferBridgeCandidates = yield* existingTransferRepository.findBridgeCandidates(null);
                yield* CONSOLIDATION_YIELD;
                const existingTransferChainReclaimCandidates = yield* existingTransferRepository.findChainReclaimCandidates(null);
                yield* CONSOLIDATION_YIELD;
                const rawExistingTransferIncomeDuplicateCandidates = yield* existingTransferRepository.findIncomeDuplicateCandidates(null);
                yield* CONSOLIDATION_YIELD;

                const blockedSourceTransactionIds = buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
                    existingTransferBridgeCandidates,
                    existingTransferChainReclaimCandidates
                );
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
                    const candidates = yield* transferPairRepository.findBridgeClaimedRepairCandidates();
                    yield* CONSOLIDATION_YIELD;

                    return candidates;
                }
            );

            const findAtmCashWithdrawalCandidates = Effect.fn('ConsolidationCoordinatorService.findAtmCashWithdrawalCandidates')(function* (
                transactionIds: readonly number[]
            ) {
                const candidates = yield* atmCashWithdrawalRepository.findCandidates(null);

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
                    const [manualReviewCandidates, refundReviewCandidates] = yield* Effect.all(
                        [transferPairRepository.findManualReviewCandidates(), refundPairRepository.findReviewCandidates()],
                        { concurrency: 'unbounded' }
                    );
                    yield* CONSOLIDATION_YIELD;

                    return manualReviewCandidates.length + refundReviewCandidates.length;
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
                    return countCanonicals(yield* transferPairRepository.findMissingTransferFeeEntries());
                }),
                repairMissingTransferFees: Effect.fn('ConsolidationCoordinatorService.repairMissingTransferFees')(function* () {
                    const movedFeeEntries = yield* transferPairRepository.findMissingTransferFeeEntries();

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
            AtmCashWithdrawalRepository.layer,
            ExistingTransferRepository.layer,
            IbanBridgeTransferRepository.layer,
            ManualExpenseDuplicateRepository.layer,
            RefundPairRepository.layer,
            TransferPairRepository.layer,
            ConsolidationExecutorService.layer,
            ConsolidationMutationService.layer,
            ConsolidationRepairExecutorService.layer,
            P2pFiatTransferConsolidationFamilyService.layer,
            TransferPairConsolidationFamilyService.layer
        ])
    );
}
