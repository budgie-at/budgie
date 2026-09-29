import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import type { ConsolidationRepositoriesInterface } from '../interface/consolidation-repositories.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    BridgeClaimRepairCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCandidateService {
    constructor(
        private readonly repositories: Pick<
            ConsolidationRepositoriesInterface,
            'atmCashWithdrawalRepository' | 'existingTransferRepository' | 'refundPairRepository' | 'transferPairRepository'
        >,
        private readonly yieldControl: () => Promise<void>
    ) {}

    @Log('enter', result => `done existingTransferIncomeDuplicateCount=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async findExistingTransferIncomeDuplicateRepairCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
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
    async findBridgeClaimedRepairCandidates(): Promise<BridgeClaimRepairCandidateInterface[]> {
        const candidates = await this.repositories.transferPairRepository.findBridgeClaimedRepairCandidates();
        await this.yieldControl();

        return candidates;
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
    async findAtmCashWithdrawalCandidates(transactionIds: readonly number[]): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const candidates = await this.repositories.atmCashWithdrawalRepository.findCandidates(null);

        return candidates.filter(candidate => transactionIds.includes(candidate.transactionId));
    }

    private buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildExistingTransferBridgeSourceTransactionIdSet(candidates: ExistingTransferBridgeCandidateInterface[]): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.existingTransferId
            ])
        );
    }

    private buildExistingTransferChainReclaimSourceTransactionIdSet(
        candidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.existingTransferId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId
            ])
        );
    }
}
