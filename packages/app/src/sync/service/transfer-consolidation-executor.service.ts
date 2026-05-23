import { TransactionConsolidationTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { db, transactionRepository } from '../../@generic/drizzle/db/db';

import { transferConsolidationSourceTransactionIdService } from './transfer-consolidation-source-transaction-id.service';
import { transferConsolidationWriterService } from './transfer-consolidation-writer.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

class TransferConsolidationExecutorService {
    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidatePair(candidate: TransferPairCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidatePairInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (result, candidate) =>
            `done result=${String(result)} transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} error=${getErrorMessage(error)}`
    )
    async consolidateAtmCashWithdrawal(candidate: AtmCashWithdrawalCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateAtmCashWithdrawalInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeTransfer(candidate: IbanBridgeTransferCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateIbanBridgeTransferInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeCanonicalDuplicate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateIbanBridgeCanonicalDuplicateInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferBridge(candidate: ExistingTransferBridgeCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateExistingTransferBridgeInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferIncomeDuplicate(candidate: ExistingTransferIncomeDuplicateCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateExistingTransferIncomeDuplicateInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeChainTransfer(candidate: IbanBridgeChainTransferCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateIbanBridgeChainTransferInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} error=${getErrorMessage(error)}`
    )
    async consolidateRefund(candidate: RefundCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateRefundInner(candidate, tx));
    }

    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE' || candidate.confidenceBucket === 'AUTO_INTERBANK_HINTED_FEE') {
            return 1;
        }

        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    private getPairConsolidationType(candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE') {
            return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
        }

        return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
    }

    private async consolidatePairInner(candidate: TransferPairCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];
        const canonicalInput: CanonicalTransferInputInterface = {
            title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.expenseEntryAccountId,
            toAccountId: candidate.incomeEntryAccountId,
            fromAmount: candidate.expenseEntryAmount,
            toAmount: candidate.incomeEntryAmount,
            exchangeRate: this.computeExchangeRate(candidate),
            consolidationType: this.getPairConsolidationType(candidate),
            fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
            toEntryExchangeRate: candidate.incomeEntryExchangeRate,
            fromEntryToIban: candidate.expenseEntryToIban
        };

        await transferConsolidationWriterService.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateAtmCashWithdrawalInner(candidate: AtmCashWithdrawalCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = [candidate.transactionId];
        const canonicalInput: CanonicalTransferInputInterface = {
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
        };

        await transferConsolidationWriterService.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateRefundInner(candidate: RefundCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

        if (!(await transferConsolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return;
        }

        await transactionRepository.setConsolidationType(candidate.expenseTransactionId, TransactionConsolidationTypeEnum.REFUND, tx);
        await transferConsolidationWriterService.copySourceTags(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);
        await transferConsolidationWriterService.moveSourcesToCanonical(
            candidate.refundIncomeTransactionIds,
            candidate.expenseTransactionId,
            tx
        );
    }

    private async consolidateIbanBridgeTransferInner(candidate: IbanBridgeTransferCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = transferConsolidationSourceTransactionIdService.buildBridgeSourceTransactionIds(candidate);
        const canonicalInput: CanonicalTransferInputInterface = {
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
        };

        await transferConsolidationWriterService.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateIbanBridgeCanonicalDuplicateInner(
        candidate: IbanBridgeCanonicalDuplicateCandidateInterface,
        tx: DB
    ): Promise<void> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (!(await transferConsolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return;
        }

        await transferConsolidationWriterService.copySourceTags(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);
        await transferConsolidationWriterService.moveSourcesToCanonical(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);
    }

    private async consolidateExistingTransferBridgeInner(candidate: ExistingTransferBridgeCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds =
            transferConsolidationSourceTransactionIdService.buildExistingTransferBridgeSourceTransactionIds(candidate);
        const canonicalInput: CanonicalTransferInputInterface = {
            title:
                candidate.existingTransferTitle ?? candidate.sourceExpenseTransactionTitle ?? candidate.bridgeIncomeTransactionTitle ?? '',
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
        };

        await transferConsolidationWriterService.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateExistingTransferIncomeDuplicateInner(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<void> {
        const sourceTransactionIds = [candidate.incomeTransactionId];

        if (!(await transferConsolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return;
        }

        if (!(await transferConsolidationWriterService.isExistingTransferStillEligible(candidate.existingTransferId, tx))) {
            return;
        }

        await transactionRepository.setConsolidationType(candidate.existingTransferId, TransactionConsolidationTypeEnum.TRANSFER_PAIR, tx);
        await transferConsolidationWriterService.copySourceTags(sourceTransactionIds, candidate.existingTransferId, tx);
        await transferConsolidationWriterService.moveSourcesToCanonical(sourceTransactionIds, candidate.existingTransferId, tx);
    }

    private async consolidateIbanBridgeChainTransferInner(candidate: IbanBridgeChainTransferCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = transferConsolidationSourceTransactionIdService.buildBridgeChainSourceTransactionIds(candidate);
        const canonicalInput: CanonicalTransferInputInterface = {
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
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            fromEntryExchangeRate: candidate.exchangeRate,
            toEntryExchangeRate: 1,
            fromEntryToIban: candidate.sourceExpenseEntryToIban
        };

        await transferConsolidationWriterService.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }
}

export const transferConsolidationExecutorService = new TransferConsolidationExecutorService();
