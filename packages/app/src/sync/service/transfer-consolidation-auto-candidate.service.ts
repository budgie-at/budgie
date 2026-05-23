import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { transferConsolidationExecutorService } from './transfer-consolidation-executor.service';

import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

class TransferConsolidationAutoCandidateService {
    @Log(
        candidates =>
            `enter pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length}`,
        (result, candidates) =>
            `done pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} consolidated=${result}`,
        (error, candidates) =>
            `throw pairCandidateCount=${candidates.pairCandidates.length} bridgeCandidateCount=${candidates.ibanBridgeTransferCandidates.length} error=${getErrorMessage(error)}`
    )
    async processGroups(candidates: ConsolidationCandidateGroupsInterface): Promise<number> {
        const bridgeChainConsolidated = await this.processIbanBridgeChainTransferCandidates(candidates.ibanBridgeChainTransferCandidates);
        const existingTransferBridgeConsolidated = await this.processExistingTransferBridgeCandidates(
            candidates.existingTransferBridgeCandidates
        );
        const bridgeDuplicateConsolidated = await this.processIbanBridgeCanonicalDuplicateCandidates(
            candidates.ibanBridgeCanonicalDuplicateCandidates
        );
        const bridgeConsolidated = await this.processIbanBridgeTransferCandidates(candidates.ibanBridgeTransferCandidates);
        const existingTransferIncomeDuplicateConsolidated = await this.processExistingTransferIncomeDuplicateCandidates(
            candidates.existingTransferIncomeDuplicateCandidates
        );
        const pairConsolidated = await this.processPairCandidates(candidates.pairCandidates);
        const atmConsolidated = await this.processAtmCashWithdrawalCandidates(candidates.atmCashWithdrawalCandidates);
        const refundConsolidated = await this.processRefundCandidates(candidates.refundCandidates);

        return (
            bridgeChainConsolidated +
            existingTransferBridgeConsolidated +
            bridgeDuplicateConsolidated +
            pairConsolidated +
            bridgeConsolidated +
            existingTransferIncomeDuplicateConsolidated +
            atmConsolidated +
            refundConsolidated
        );
    }

    @Log(
        candidates =>
            `enter buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')}`,
        (result, candidates) =>
            `done buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processPairCandidates(candidates: TransferPairCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => transferConsolidationExecutorService.consolidatePair(candidate));
    }

    @Log(
        candidates =>
            `enter transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')}`,
        (result, candidates) =>
            `done transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processAtmCashWithdrawalCandidates(candidates: AtmCashWithdrawalCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateAtmCashWithdrawal(candidate)
        );
    }

    @Log(
        candidates =>
            `enter expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')}`,
        (result, candidates) =>
            `done expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')} error=${getErrorMessage(error)}`
    )
    private async processIbanBridgeTransferCandidates(candidates: IbanBridgeTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeTransfer(candidate)
        );
    }

    @Log(
        candidates =>
            `enter expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingCanonicalTransferIds=${candidates.map(candidate => candidate.existingCanonicalTransferId).join(',')}`,
        (result, candidates) =>
            `done expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingCanonicalTransferIds=${candidates.map(candidate => candidate.existingCanonicalTransferId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingCanonicalTransferIds=${candidates.map(candidate => candidate.existingCanonicalTransferId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processIbanBridgeCanonicalDuplicateCandidates(
        candidates: IbanBridgeCanonicalDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeCanonicalDuplicate(candidate)
        );
    }

    @Log(
        candidates =>
            `enter sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')}`,
        (result, candidates) =>
            `done sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processExistingTransferBridgeCandidates(candidates: ExistingTransferBridgeCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateExistingTransferBridge(candidate)
        );
    }

    @Log(
        candidates =>
            `enter existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')}`,
        (result, candidates) =>
            `done existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw existingTransferIds=${candidates.map(candidate => candidate.existingTransferId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateExistingTransferIncomeDuplicate(candidate)
        );
    }

    @Log(
        candidates =>
            `enter sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} bridgeExpenseTransactionIds=${candidates.map(candidate => candidate.bridgeExpenseTransactionId).join(',')} targetIncomeTransactionIds=${candidates.map(candidate => candidate.targetIncomeTransactionId).join(',')}`,
        (result, candidates) =>
            `done sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} bridgeExpenseTransactionIds=${candidates.map(candidate => candidate.bridgeExpenseTransactionId).join(',')} targetIncomeTransactionIds=${candidates.map(candidate => candidate.targetIncomeTransactionId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw sourceExpenseTransactionIds=${candidates.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${candidates.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} bridgeExpenseTransactionIds=${candidates.map(candidate => candidate.bridgeExpenseTransactionId).join(',')} targetIncomeTransactionIds=${candidates.map(candidate => candidate.targetIncomeTransactionId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processIbanBridgeChainTransferCandidates(candidates: IbanBridgeChainTransferCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate =>
            transferConsolidationExecutorService.consolidateIbanBridgeChainTransfer(candidate)
        );
    }

    @Log(
        candidates =>
            `enter expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} refundIncomeTransactionIds=${candidates.map(candidate => candidate.refundIncomeTransactionIds.join('+')).join(',')}`,
        (result, candidates) =>
            `done expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} refundIncomeTransactionIds=${candidates.map(candidate => candidate.refundIncomeTransactionIds.join('+')).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} refundIncomeTransactionIds=${candidates.map(candidate => candidate.refundIncomeTransactionIds.join('+')).join(',')} error=${getErrorMessage(error)}`
    )
    private async processRefundCandidates(candidates: RefundCandidateInterface[]): Promise<number> {
        return this.reduceConsolidations(candidates, candidate => transferConsolidationExecutorService.consolidateRefund(candidate));
    }

    private async reduceConsolidations<T>(candidates: T[], consolidate: (candidate: T) => Promise<void>): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await consolidate(candidate).then(
                () => true,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }
}

export const transferConsolidationAutoCandidateService = new TransferConsolidationAutoCandidateService();
