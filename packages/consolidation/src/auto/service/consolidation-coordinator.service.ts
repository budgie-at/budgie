import * as Effect from 'effect/Effect';

import { AtmCashWithdrawalConsolidationFamilyService } from './atm-cash-withdrawal-consolidation-family.service';
import { BridgeClaimRepairConsolidationFamilyService } from './bridge-claim-repair-consolidation-family.service';
import { ExistingTransferBridgeConsolidationFamilyService } from './existing-transfer-bridge-consolidation-family.service';
import { ExistingTransferChainReclaimConsolidationFamilyService } from './existing-transfer-chain-reclaim-consolidation-family.service';
import { ExistingTransferIncomeDuplicateConsolidationFamilyService } from './existing-transfer-income-duplicate-consolidation-family.service';
import { IbanBridgeCanonicalDuplicateConsolidationFamilyService } from './iban-bridge-canonical-duplicate-consolidation-family.service';
import { IbanBridgeCanonicalSupersessionConsolidationFamilyService } from './iban-bridge-canonical-supersession-consolidation-family.service';
import { IbanBridgeChainTransferConsolidationFamilyService } from './iban-bridge-chain-transfer-consolidation-family.service';
import { IbanBridgeTransferConsolidationFamilyService } from './iban-bridge-transfer-consolidation-family.service';
import { P2pFiatTransferConsolidationFamilyService } from './p2p-fiat-transfer-consolidation-family.service';
import { RefundPairConsolidationFamilyService } from './refund-pair-consolidation-family.service';
import { TransferPairConsolidationFamilyService } from './transfer-pair-consolidation-family.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationRepositoriesInterface } from '../interface/consolidation-repositories.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCoordinatorService {
    readonly families: ConsolidationFamilyStrategyInterface[];

    readonly consolidate = Effect.fn('ConsolidationCoordinatorService.consolidate')(function* (
        this: ConsolidationCoordinatorService,
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ) {
        const blockedSourceTransactionIds = new Set<number>();
        let consolidated = 0;
        let found = 0;

        for (const family of this.families) {
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

    readonly countAutoCandidates = Effect.fn('ConsolidationCoordinatorService.countAutoCandidates')(function* (
        this: ConsolidationCoordinatorService,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const blockedSourceTransactionIds = new Set<number>();
        let found = 0;

        for (const family of this.families) {
            const preview = yield* family.preview({ blockedSourceTransactionIds: new Set(blockedSourceTransactionIds), scope });

            for (const sourceTransactionId of preview.blockedSourceTransactionIds) {
                blockedSourceTransactionIds.add(sourceTransactionId);
            }

            found += preview.found;
        }

        return found;
    });

    readonly countManualReviewCandidates = Effect.fn('ConsolidationCoordinatorService.countManualReviewCandidates')(
        function* (this: ConsolidationCoordinatorService) {
            const [manualReviewCandidates, refundReviewCandidates] = yield* Effect.all(
                [
                    this.repositories.transferPairRepository.findManualReviewCandidates(),
                    this.repositories.refundPairRepository.findReviewCandidates()
                ],
                { concurrency: 'unbounded' }
            );
            yield* this.yieldNow();

            return manualReviewCandidates.length + refundReviewCandidates.length;
        }
    );

    readonly findAtmCashWithdrawalTransactionIds = Effect.fn('ConsolidationCoordinatorService.findAtmCashWithdrawalTransactionIds')(
        function* (this: ConsolidationCoordinatorService, transactionIds: readonly number[]) {
            const candidates = yield* this.findAtmCashWithdrawalCandidates(transactionIds);

            return candidates.map(candidate => candidate.transactionId);
        }
    );

    readonly moveAtmCashWithdrawalsToCash = Effect.fn('ConsolidationCoordinatorService.moveAtmCashWithdrawalsToCash')(function* (
        this: ConsolidationCoordinatorService,
        transactionIds: readonly number[]
    ) {
        const candidates = yield* this.findAtmCashWithdrawalCandidates(transactionIds);

        return yield* this.atmCashWithdrawalFamily.processCandidateList(candidates);
    });

    readonly countExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
        'ConsolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates'
    )(function* (this: ConsolidationCoordinatorService) {
        return (yield* this.findExistingTransferIncomeDuplicateRepairCandidates()).length;
    });

    readonly repairExistingTransferIncomeDuplicates = Effect.fn('ConsolidationCoordinatorService.repairExistingTransferIncomeDuplicates')(
        function* (this: ConsolidationCoordinatorService) {
            const candidates = yield* this.findExistingTransferIncomeDuplicateRepairCandidates();

            return yield* this.existingTransferIncomeDuplicateFamily.processCandidateList(candidates);
        }
    );

    readonly countBridgeClaimRepairCandidates = Effect.fn('ConsolidationCoordinatorService.countBridgeClaimRepairCandidates')(
        function* (this: ConsolidationCoordinatorService) {
            return (yield* this.findBridgeClaimedRepairCandidates()).length;
        }
    );

    readonly repairBridgeClaimedTransferPairs = Effect.fn('ConsolidationCoordinatorService.repairBridgeClaimedTransferPairs')(
        function* (this: ConsolidationCoordinatorService) {
            const candidates = yield* this.findBridgeClaimedRepairCandidates();
            const repairedCount = yield* this.bridgeClaimRepairFamily.processCandidateList(candidates);

            if (repairedCount > 0) {
                yield* this.consolidate(null);
            }

            return repairedCount;
        }
    );

    private readonly existingTransferIncomeDuplicateFamily: ExistingTransferIncomeDuplicateConsolidationFamilyService;

    private readonly bridgeClaimRepairFamily: BridgeClaimRepairConsolidationFamilyService;

    private readonly atmCashWithdrawalFamily: AtmCashWithdrawalConsolidationFamilyService;

    private readonly findExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
        'ConsolidationCoordinatorService.findExistingTransferIncomeDuplicateRepairCandidates'
    )(function* (this: ConsolidationCoordinatorService) {
        const { existingTransferRepository } = this.repositories;
        const existingTransferBridgeCandidates = yield* existingTransferRepository.findBridgeCandidates(null);
        yield* this.yieldNow();
        const existingTransferChainReclaimCandidates = yield* existingTransferRepository.findChainReclaimCandidates(null);
        yield* this.yieldNow();
        const rawExistingTransferIncomeDuplicateCandidates = yield* existingTransferRepository.findIncomeDuplicateCandidates(null);
        yield* this.yieldNow();

        const blockedSourceTransactionIds = this.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates
        );
        const existingTransferIncomeDuplicateCandidates = rawExistingTransferIncomeDuplicateCandidates.filter(
            candidate =>
                !blockedSourceTransactionIds.has(candidate.existingTransferId) &&
                !blockedSourceTransactionIds.has(candidate.duplicateTransactionId)
        );
        yield* this.yieldNow();

        return existingTransferIncomeDuplicateCandidates;
    });

    private readonly findBridgeClaimedRepairCandidates = Effect.fn('ConsolidationCoordinatorService.findBridgeClaimedRepairCandidates')(
        function* (this: ConsolidationCoordinatorService) {
            const candidates = yield* this.repositories.transferPairRepository.findBridgeClaimedRepairCandidates();
            yield* this.yieldNow();

            return candidates;
        }
    );

    private readonly findAtmCashWithdrawalCandidates = Effect.fn('ConsolidationCoordinatorService.findAtmCashWithdrawalCandidates')(
        function* (this: ConsolidationCoordinatorService, transactionIds: readonly number[]) {
            const candidates = yield* this.repositories.atmCashWithdrawalRepository.findCandidates(null);

            return candidates.filter(candidate => transactionIds.includes(candidate.transactionId));
        }
    );

    constructor(
        private readonly repositories: ConsolidationRepositoriesInterface,
        consolidationExecutorService: ConsolidationExecutorService,
        consolidationRepairExecutorService: ConsolidationRepairExecutorService,
        private readonly yieldControl: () => Promise<void>
    ) {
        this.existingTransferIncomeDuplicateFamily = new ExistingTransferIncomeDuplicateConsolidationFamilyService(
            repositories.existingTransferRepository,
            consolidationRepairExecutorService,
            yieldControl
        );
        this.bridgeClaimRepairFamily = new BridgeClaimRepairConsolidationFamilyService(
            repositories.transferPairRepository,
            consolidationRepairExecutorService,
            yieldControl
        );
        this.atmCashWithdrawalFamily = new AtmCashWithdrawalConsolidationFamilyService(
            repositories.atmCashWithdrawalRepository,
            consolidationExecutorService,
            yieldControl
        );
        this.families = [
            new IbanBridgeChainTransferConsolidationFamilyService(
                repositories.ibanBridgeTransferRepository,
                consolidationExecutorService,
                yieldControl
            ),
            new ExistingTransferBridgeConsolidationFamilyService(
                repositories.existingTransferRepository,
                consolidationExecutorService,
                yieldControl
            ),
            new ExistingTransferChainReclaimConsolidationFamilyService(
                repositories.existingTransferRepository,
                consolidationRepairExecutorService,
                yieldControl
            ),
            new IbanBridgeCanonicalDuplicateConsolidationFamilyService(
                repositories.ibanBridgeTransferRepository,
                consolidationRepairExecutorService,
                yieldControl
            ),
            new IbanBridgeTransferConsolidationFamilyService(
                repositories.ibanBridgeTransferRepository,
                consolidationExecutorService,
                yieldControl
            ),
            new IbanBridgeCanonicalSupersessionConsolidationFamilyService(
                repositories.ibanBridgeTransferRepository,
                consolidationRepairExecutorService,
                yieldControl
            ),
            this.existingTransferIncomeDuplicateFamily,
            new P2pFiatTransferConsolidationFamilyService(
                repositories.transferPairRepository,
                consolidationExecutorService,
                consolidationRepairExecutorService,
                yieldControl
            ),
            new TransferPairConsolidationFamilyService(repositories.transferPairRepository, consolidationExecutorService, yieldControl),
            new RefundPairConsolidationFamilyService(repositories.refundPairRepository, consolidationRepairExecutorService, yieldControl)
        ];
    }

    private yieldNow(): Effect.Effect<void> {
        return Effect.promise(() => this.yieldControl());
    }

    private buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
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
    }
}
