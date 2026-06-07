import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { ConsolidationSourceTransactionSetService } from './consolidation-source-transaction-set.service';

import type { ConsolidationCandidateRepositoriesInterface } from '../interface/consolidation-candidate-repositories.interface';
import type { ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

export class ConsolidationCandidateService {
    private readonly sourceTransactionSetService = new ConsolidationSourceTransactionSetService();

    constructor(
        private readonly repositories: ConsolidationCandidateRepositoriesInterface,
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

        const blockedSourceTransactionIds = this.sourceTransactionSetService.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates
        );
        const existingTransferIncomeDuplicateCandidates = rawExistingTransferIncomeDuplicateCandidates.filter(
            candidate =>
                !blockedSourceTransactionIds.has(candidate.existingTransferId) &&
                !blockedSourceTransactionIds.has(candidate.incomeTransactionId)
        );
        await this.yieldControl();

        return existingTransferIncomeDuplicateCandidates;
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        const [manualReviewCandidates, atmCashWithdrawalReviewCandidates, refundReviewCandidates] = await Promise.all([
            this.repositories.transferPairRepository.findManualReviewCandidates(),
            this.repositories.atmCashWithdrawalRepository.findReviewCandidates(),
            this.repositories.refundPairRepository.findReviewCandidates()
        ]);
        await this.yieldControl();

        return manualReviewCandidates.length + atmCashWithdrawalReviewCandidates.length + refundReviewCandidates.length;
    }
}
