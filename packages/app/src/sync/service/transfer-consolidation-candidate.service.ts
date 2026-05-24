import { Log, getLogger } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { refundPairRepository, transferPairRepository } from '../../@generic/drizzle/db/db';

import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    RefundReviewCandidateInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

const logger = getLogger('TransferConsolidationCandidateService');

class TransferConsolidationCandidateService {
    @Log(
        'enter',
        result =>
            `done manualCount=${result.manualReviewCandidates.length} atmReviewCount=${result.atmCashWithdrawalReviewCandidates.length} pairCount=${result.pairCandidates.length} ibanBridgeChainCount=${result.ibanBridgeChainTransferCandidates.length} ibanBridgeDuplicateCount=${result.ibanBridgeCanonicalDuplicateCandidates.length} existingTransferBridgeCount=${result.existingTransferBridgeCandidates.length} existingTransferIncomeDuplicateCount=${result.existingTransferIncomeDuplicateCandidates.length} ibanBridgeCount=${result.ibanBridgeTransferCandidates.length} atmCount=${result.atmCashWithdrawalCandidates.length} refundCount=${result.refundCandidates.length} refundReviewCount=${result.refundReviewCandidates.length}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findGroups(): Promise<ConsolidationCandidateGroupsInterface> {
        const manualReviewCandidates = await this.findManualReviewCandidates();
        const atmCashWithdrawalReviewCandidates = await this.findAtmCashWithdrawalReviewCandidates();
        const ibanBridgeChainTransferCandidates = await this.findIbanBridgeChainTransferCandidates();
        const ibanBridgeCanonicalDuplicateCandidates = await this.findIbanBridgeCanonicalDuplicateCandidates();
        const existingTransferBridgeCandidates = await this.findExistingTransferBridgeCandidates();
        const ibanBridgeTransferCandidates = this.filterIbanBridgeTransferCandidates(
            await this.findIbanBridgeTransferCandidates(),
            ibanBridgeChainTransferCandidates
        );
        const existingTransferIncomeDuplicateCandidates = this.filterExistingTransferIncomeDuplicateCandidates(
            await this.findExistingTransferIncomeDuplicateCandidates(),
            existingTransferBridgeCandidates
        );
        const pairCandidates = this.filterPairCandidates(
            await this.findPairCandidates(),
            this.buildBridgeSourceTransactionIdSet(
                ibanBridgeChainTransferCandidates,
                existingTransferBridgeCandidates,
                ibanBridgeTransferCandidates,
                existingTransferIncomeDuplicateCandidates
            )
        );
        const atmCashWithdrawalCandidates = await this.findAtmCashWithdrawalCandidates();
        const refundCandidates = await this.findRefundCandidates();
        const refundReviewCandidates = await this.findRefundReviewCandidates();

        return {
            manualReviewCandidates,
            atmCashWithdrawalReviewCandidates,
            existingTransferBridgeCandidates,
            existingTransferIncomeDuplicateCandidates,
            ibanBridgeCanonicalDuplicateCandidates,
            ibanBridgeChainTransferCandidates,
            pairCandidates,
            ibanBridgeTransferCandidates,
            atmCashWithdrawalCandidates,
            refundCandidates,
            refundReviewCandidates
        };
    }

    private async findPairCandidates(): Promise<TransferPairCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findCandidates();

        logger.log('findPairCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findManualReviewCandidates();

        logger.log('findManualReviewCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findAtmCashWithdrawalCandidates();

        logger.log('findAtmCashWithdrawalCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findAtmCashWithdrawalReviewCandidates();

        logger.log('findAtmCashWithdrawalReviewCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findIbanBridgeTransferCandidates();

        logger.log('findIbanBridgeTransferCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findIbanBridgeCanonicalDuplicateCandidates(): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates();

        logger.log('findIbanBridgeCanonicalDuplicateCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findExistingTransferBridgeCandidates(): Promise<ExistingTransferBridgeCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findExistingTransferBridgeCandidates();

        logger.log('findExistingTransferBridgeCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findExistingTransferIncomeDuplicateCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findExistingTransferIncomeDuplicateCandidates();

        logger.log('findExistingTransferIncomeDuplicateCandidates:duration', {
            count: candidates.length,
            durationMs: Date.now() - startedAt
        });

        return candidates;
    }

    private async findIbanBridgeChainTransferCandidates(): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await transferPairRepository.findIbanBridgeChainTransferCandidates();

        logger.log('findIbanBridgeChainTransferCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findRefundCandidates(): Promise<RefundCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await refundPairRepository.findCandidates();

        logger.log('findRefundCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private async findRefundReviewCandidates(): Promise<RefundReviewCandidateInterface[]> {
        const startedAt = Date.now();
        const candidates = await refundPairRepository.findReviewCandidates();

        logger.log('findRefundReviewCandidates:duration', { count: candidates.length, durationMs: Date.now() - startedAt });

        return candidates;
    }

    private filterPairCandidates(
        candidates: TransferPairCandidateInterface[],
        sourceTransactionIds: Set<number>
    ): TransferPairCandidateInterface[] {
        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[],
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[]
    ): ExistingTransferIncomeDuplicateCandidateInterface[] {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);

        return candidates.filter(
            candidate => !sourceTransactionIds.has(candidate.existingTransferId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterIbanBridgeTransferCandidates(
        candidates: IbanBridgeTransferCandidateInterface[],
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[]
    ): IbanBridgeTransferCandidateInterface[] {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);

        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private buildBridgeSourceTransactionIdSet(
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[],
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        bridgeCandidates: IbanBridgeTransferCandidateInterface[],
        existingTransferIncomeDuplicateCandidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);
        const existingTransferBridgeSourceTransactionIds = existingTransferBridgeCandidates.flatMap(candidate => [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ]);
        const bridgeSourceTransactionIds = bridgeCandidates
            .flatMap(candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId, candidate.existingDirectTransferId])
            .filter(isDefined);
        const duplicateSourceTransactionIds = existingTransferIncomeDuplicateCandidates.map(candidate => candidate.incomeTransactionId);
        const additionalSourceTransactionIds = [
            ...existingTransferBridgeSourceTransactionIds,
            ...bridgeSourceTransactionIds,
            ...duplicateSourceTransactionIds
        ];

        for (const sourceTransactionId of additionalSourceTransactionIds) {
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

    private buildBridgeChainSourceTransactionIdSet(candidates: IbanBridgeChainTransferCandidateInterface[]): Set<number> {
        const sourceTransactionIds = new Set<number>();

        for (const candidate of candidates) {
            sourceTransactionIds.add(candidate.sourceExpenseTransactionId);
            sourceTransactionIds.add(candidate.bridgeIncomeTransactionId);
            sourceTransactionIds.add(candidate.bridgeExpenseTransactionId);
            sourceTransactionIds.add(candidate.targetIncomeTransactionId);
        }

        return sourceTransactionIds;
    }
}

export const transferConsolidationCandidateService = new TransferConsolidationCandidateService();
