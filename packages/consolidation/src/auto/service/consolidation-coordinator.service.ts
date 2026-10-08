import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ConsolidationMutationService } from '../../executor/service/consolidation-mutation.service';
import { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';

import { AtmCashWithdrawalConsolidationFamilyService } from './atm-cash-withdrawal-consolidation-family.service';
import { BridgeClaimRepairConsolidationFamilyService } from './bridge-claim-repair-consolidation-family.service';
import { ExistingTransferBridgeConsolidationFamilyService } from './existing-transfer-bridge-consolidation-family.service';
import { ExistingTransferChainReclaimConsolidationFamilyService } from './existing-transfer-chain-reclaim-consolidation-family.service';
import { ExistingTransferIncomeDuplicateConsolidationFamilyService } from './existing-transfer-income-duplicate-consolidation-family.service';
import { IbanBridgeCanonicalDuplicateConsolidationFamilyService } from './iban-bridge-canonical-duplicate-consolidation-family.service';
import { IbanBridgeCanonicalSupersessionConsolidationFamilyService } from './iban-bridge-canonical-supersession-consolidation-family.service';
import { IbanBridgeChainTransferConsolidationFamilyService } from './iban-bridge-chain-transfer-consolidation-family.service';
import { IbanBridgeTransferConsolidationFamilyService } from './iban-bridge-transfer-consolidation-family.service';
import { ManualExpenseDuplicateConsolidationFamilyService } from './manual-expense-duplicate-consolidation-family.service';
import { P2pFiatTransferConsolidationFamilyService } from './p2p-fiat-transfer-consolidation-family.service';
import { RefundPairConsolidationFamilyService } from './refund-pair-consolidation-family.service';
import { TransferPairConsolidationFamilyService } from './transfer-pair-consolidation-family.service';

import type { FeeEntrySourceInterface } from '../../query/interface/fee-entry-source.interface';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCoordinatorService extends Context.Service<ConsolidationCoordinatorService>()(
    '@budgie/consolidation/ConsolidationCoordinatorService',
    {
        make: Effect.gen(function* () {
            const atmCashWithdrawalRepository = yield* AtmCashWithdrawalRepository;
            const existingTransferRepository = yield* ExistingTransferRepository;
            const refundPairRepository = yield* RefundPairRepository;
            const transferPairRepository = yield* TransferPairRepository;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const ibanBridgeCanonicalDuplicateFamily = yield* IbanBridgeCanonicalDuplicateConsolidationFamilyService;
            const existingTransferIncomeDuplicateFamily = yield* ExistingTransferIncomeDuplicateConsolidationFamilyService;
            const bridgeClaimRepairFamily = yield* BridgeClaimRepairConsolidationFamilyService;
            const atmCashWithdrawalFamily = yield* AtmCashWithdrawalConsolidationFamilyService;
            const families: ConsolidationFamilyStrategyInterface[] = [
                yield* IbanBridgeChainTransferConsolidationFamilyService,
                yield* ExistingTransferBridgeConsolidationFamilyService,
                yield* ExistingTransferChainReclaimConsolidationFamilyService,
                ibanBridgeCanonicalDuplicateFamily,
                yield* IbanBridgeTransferConsolidationFamilyService,
                ibanBridgeCanonicalDuplicateFamily,
                yield* IbanBridgeCanonicalSupersessionConsolidationFamilyService,
                existingTransferIncomeDuplicateFamily,
                yield* P2pFiatTransferConsolidationFamilyService,
                yield* TransferPairConsolidationFamilyService,
                yield* RefundPairConsolidationFamilyService,
                yield* ManualExpenseDuplicateConsolidationFamilyService
            ];

            const buildExistingTransferDuplicateBlockedSourceTransactionIdSet = (
                existingTransferBridgeCandidates: readonly ExistingTransferBridgeCandidateInterface[],
                existingTransferChainReclaimCandidates: readonly ExistingTransferChainReclaimCandidateInterface[]
            ): Set<number> => {
                const sourceTransactionIds = new Set(
                    existingTransferBridgeCandidates.flatMap(candidate => [
                        candidate.sourceExpenseTransactionId,
                        candidate.bridgeIncomeTransactionId,
                        candidate.existingTransferId
                    ])
                );

                for (const candidate of existingTransferChainReclaimCandidates) {
                    sourceTransactionIds.add(candidate.existingTransferId);
                    sourceTransactionIds.add(candidate.bridgeIncomeTransactionId);
                    sourceTransactionIds.add(candidate.bridgeExpenseTransactionId);
                }

                return sourceTransactionIds;
            };

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
            RefundPairRepository.layer,
            TransferPairRepository.layer,
            ConsolidationMutationService.layer,
            AtmCashWithdrawalConsolidationFamilyService.layer,
            BridgeClaimRepairConsolidationFamilyService.layer,
            ExistingTransferBridgeConsolidationFamilyService.layer,
            ExistingTransferChainReclaimConsolidationFamilyService.layer,
            ExistingTransferIncomeDuplicateConsolidationFamilyService.layer,
            IbanBridgeCanonicalDuplicateConsolidationFamilyService.layer,
            IbanBridgeCanonicalSupersessionConsolidationFamilyService.layer,
            IbanBridgeChainTransferConsolidationFamilyService.layer,
            IbanBridgeTransferConsolidationFamilyService.layer,
            ManualExpenseDuplicateConsolidationFamilyService.layer,
            P2pFiatTransferConsolidationFamilyService.layer,
            RefundPairConsolidationFamilyService.layer,
            TransferPairConsolidationFamilyService.layer
        ])
    );
}
