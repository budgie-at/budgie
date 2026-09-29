import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

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
    AtmCashWithdrawalCandidateInterface,
    BridgeClaimRepairCandidateInterface,
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCoordinatorService {
    readonly families: ConsolidationFamilyStrategyInterface[];

    private readonly existingTransferIncomeDuplicateFamily: ExistingTransferIncomeDuplicateConsolidationFamilyService;

    private readonly bridgeClaimRepairFamily: BridgeClaimRepairConsolidationFamilyService;

    private readonly atmCashWithdrawalFamily: AtmCashWithdrawalConsolidationFamilyService;

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

    @Log(
        (scope, onProgress) =>
            `enter hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async consolidate(
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        let resultPromise = Promise.resolve({
            blockedSourceTransactionIds: new Set<number>(),
            consolidated: 0,
            found: 0,
            processedCandidateGroupCount: 0
        });

        for (const family of this.families) {
            resultPromise = resultPromise.then(async currentResult => {
                const familyResult = await family.process({
                    blockedSourceTransactionIds: currentResult.blockedSourceTransactionIds,
                    onProgress: processedCount => {
                        const processedCandidateGroupCount = currentResult.processedCandidateGroupCount + processedCount;
                        onProgress?.(processedCandidateGroupCount);
                    },
                    scope
                });
                const blockedSourceTransactionIds = new Set(currentResult.blockedSourceTransactionIds);
                this.addBlockedSourceTransactionIds(blockedSourceTransactionIds, familyResult.blockedSourceTransactionIds);

                return {
                    blockedSourceTransactionIds,
                    consolidated: currentResult.consolidated + familyResult.consolidated,
                    found: currentResult.found + familyResult.found,
                    processedCandidateGroupCount: currentResult.processedCandidateGroupCount + familyResult.found
                };
            });
        }
        const result = await resultPromise;

        return { found: result.found, consolidated: result.consolidated };
    }

    @Log(
        scope => `enter hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (result, scope) => `done hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} count=${result}`,
        (error, scope) =>
            `throw hasScope=${String(isDefined(scope))} scopeIdCount=${scope?.transactionIds.length ?? 0} error=${getErrorMessage(error)}`
    )
    async countAutoCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<number> {
        let resultPromise = Promise.resolve({ blockedSourceTransactionIds: new Set<number>(), found: 0 });

        for (const family of this.families) {
            resultPromise = resultPromise.then(async currentResult => {
                const preview = await family.preview({
                    blockedSourceTransactionIds: currentResult.blockedSourceTransactionIds,
                    scope
                });
                const blockedSourceTransactionIds = new Set(currentResult.blockedSourceTransactionIds);
                this.addBlockedSourceTransactionIds(blockedSourceTransactionIds, preview.blockedSourceTransactionIds);

                return {
                    blockedSourceTransactionIds,
                    found: currentResult.found + preview.found
                };
            });
        }
        const result = await resultPromise;

        return result.found;
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        const [manualReviewCandidates, refundReviewCandidates] = await Promise.all([
            this.repositories.transferPairRepository.findManualReviewCandidates(),
            this.repositories.refundPairRepository.findReviewCandidates()
        ]);
        await this.yieldControl();

        return manualReviewCandidates.length + refundReviewCandidates.length;
    }

    @Log(
        transactionIds => `enter transactionCount=${transactionIds.length}`,
        (result, transactionIds) => `done candidateCount=${result.length} transactionCount=${transactionIds.length}`,
        (error, transactionIds) => `throw transactionCount=${transactionIds.length} error=${getErrorMessage(error)}`
    )
    async findAtmCashWithdrawalTransactionIds(transactionIds: readonly number[]): Promise<number[]> {
        const candidates = await this.findAtmCashWithdrawalCandidates(transactionIds);

        return candidates.map(candidate => candidate.transactionId);
    }

    @Log(
        transactionIds => `enter transactionCount=${transactionIds.length}`,
        (result, transactionIds) => `done consolidated=${result} transactionCount=${transactionIds.length}`,
        (error, transactionIds) => `throw transactionCount=${transactionIds.length} error=${getErrorMessage(error)}`
    )
    async moveAtmCashWithdrawalsToCash(transactionIds: readonly number[]): Promise<number> {
        const candidates = await this.findAtmCashWithdrawalCandidates(transactionIds);

        return this.atmCashWithdrawalFamily.processCandidateList(candidates);
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countExistingTransferIncomeDuplicateRepairCandidates(): Promise<number> {
        return (await this.findExistingTransferIncomeDuplicateRepairCandidates()).length;
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async repairExistingTransferIncomeDuplicates(): Promise<number> {
        const candidates = await this.findExistingTransferIncomeDuplicateRepairCandidates();

        return this.existingTransferIncomeDuplicateFamily.processCandidateList(candidates);
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countBridgeClaimRepairCandidates(): Promise<number> {
        return (await this.findBridgeClaimedRepairCandidates()).length;
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async repairBridgeClaimedTransferPairs(): Promise<number> {
        const candidates = await this.findBridgeClaimedRepairCandidates();
        const repairedCount = await this.bridgeClaimRepairFamily.processCandidateList(candidates);

        if (repairedCount > 0) {
            await this.consolidate(null);
        }

        return repairedCount;
    }

    @Log('enter', result => `done existingTransferIncomeDuplicateCount=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    private async findExistingTransferIncomeDuplicateRepairCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const existingTransferBridgeCandidates = await this.repositories.existingTransferRepository.findBridgeCandidates(null);
        await this.yieldControl();
        const existingTransferChainReclaimCandidates = await this.repositories.existingTransferRepository.findChainReclaimCandidates(null);
        await this.yieldControl();
        const rawExistingTransferIncomeDuplicateCandidates =
            await this.repositories.existingTransferRepository.findIncomeDuplicateCandidates(null);
        await this.yieldControl();

        const blockedSourceTransactionIds = this.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates
        );
        const existingTransferIncomeDuplicateCandidates = rawExistingTransferIncomeDuplicateCandidates.filter(
            candidate =>
                !blockedSourceTransactionIds.has(candidate.existingTransferId) &&
                !blockedSourceTransactionIds.has(candidate.duplicateTransactionId)
        );
        await this.yieldControl();

        return existingTransferIncomeDuplicateCandidates;
    }

    @Log('enter', result => `done bridgeClaimRepairCount=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    private async findBridgeClaimedRepairCandidates(): Promise<BridgeClaimRepairCandidateInterface[]> {
        const candidates = await this.repositories.transferPairRepository.findBridgeClaimedRepairCandidates();
        await this.yieldControl();

        return candidates;
    }

    private async findAtmCashWithdrawalCandidates(transactionIds: readonly number[]): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const candidates = await this.repositories.atmCashWithdrawalRepository.findCandidates(null);

        return candidates.filter(candidate => transactionIds.includes(candidate.transactionId));
    }

    private addBlockedSourceTransactionIds(blockedSourceTransactionIds: Set<number>, sourceTransactionIds: number[]): void {
        for (const sourceTransactionId of sourceTransactionIds) {
            blockedSourceTransactionIds.add(sourceTransactionId);
        }
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
