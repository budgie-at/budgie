import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { refundPairRepository, transferPairRepository } from '../../@generic/drizzle/db/db';

import { transferConsolidationSourceTransactionIdService } from './transfer-consolidation-source-transaction-id.service';

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

class TransferConsolidationCandidateService {
    @Log(
        'enter',
        result =>
            `done manualExpenseTransactionIds=${result.manualReviewCandidates.map(candidate => candidate.expenseTransactionId).join(',')} atmReviewTransactionIds=${result.atmCashWithdrawalReviewCandidates.map(candidate => candidate.transactionId).join(',')} pairExpenseTransactionIds=${result.pairCandidates.map(candidate => candidate.expenseTransactionId).join(',')} ibanBridgeChainSourceExpenseTransactionIds=${result.ibanBridgeChainTransferCandidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} ibanBridgeDuplicateExpenseTransactionIds=${result.ibanBridgeCanonicalDuplicateCandidates.map(candidate => candidate.expenseTransactionId).join(',')} existingTransferBridgeSourceExpenseTransactionIds=${result.existingTransferBridgeCandidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} existingTransferIncomeDuplicateIncomeTransactionIds=${result.existingTransferIncomeDuplicateCandidates.map(candidate => candidate.incomeTransactionId).join(',')} ibanBridgeExpenseTransactionIds=${result.ibanBridgeTransferCandidates.map(candidate => candidate.expenseTransactionId).join(',')} atmTransactionIds=${result.atmCashWithdrawalCandidates.map(candidate => candidate.transactionId).join(',')} refundExpenseTransactionIds=${result.refundCandidates.map(candidate => candidate.expenseTransactionId).join(',')} refundReviewExpenseTransactionIds=${result.refundReviewCandidates.map(candidate => candidate.expenseTransactionId).join(',')}`,
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
            transferConsolidationSourceTransactionIdService.buildBridgeSourceTransactionIdSet(
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

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findPairCandidates(): Promise<TransferPairCandidateInterface[]> {
        return transferPairRepository.findCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        return transferPairRepository.findManualReviewCandidates();
    }

    @Log(
        'enter',
        result => `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return transferPairRepository.findAtmCashWithdrawalCandidates();
    }

    @Log(
        'enter',
        result => `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        return transferPairRepository.findAtmCashWithdrawalReviewCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeTransferCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findIbanBridgeCanonicalDuplicateCandidates(): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates();
    }

    @Log(
        'enter',
        result => `done sourceExpenseTransactionIds=${result.map(candidate => candidate.sourceExpenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findExistingTransferBridgeCandidates(): Promise<ExistingTransferBridgeCandidateInterface[]> {
        return transferPairRepository.findExistingTransferBridgeCandidates();
    }

    @Log(
        'enter',
        result => `done incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findExistingTransferIncomeDuplicateCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        return transferPairRepository.findExistingTransferIncomeDuplicateCandidates();
    }

    @Log(
        'enter',
        result => `done sourceExpenseTransactionIds=${result.map(candidate => candidate.sourceExpenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findIbanBridgeChainTransferCandidates(): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeChainTransferCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findRefundCandidates(): Promise<RefundCandidateInterface[]> {
        return refundPairRepository.findCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findRefundReviewCandidates(): Promise<RefundReviewCandidateInterface[]> {
        return refundPairRepository.findReviewCandidates();
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
        const sourceTransactionIds =
            transferConsolidationSourceTransactionIdService.buildExistingTransferBridgeSourceTransactionIdSet(
                existingTransferBridgeCandidates
            );

        return candidates.filter(
            candidate => !sourceTransactionIds.has(candidate.existingTransferId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterIbanBridgeTransferCandidates(
        candidates: IbanBridgeTransferCandidateInterface[],
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[]
    ): IbanBridgeTransferCandidateInterface[] {
        const sourceTransactionIds =
            transferConsolidationSourceTransactionIdService.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);

        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }
}

export const transferConsolidationCandidateService = new TransferConsolidationCandidateService();
