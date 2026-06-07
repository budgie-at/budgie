import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transferPairRepository } from '../../../@generic/drizzle/db/db';
import { ConsolidationRuleTypeEnum } from '../../enum/consolidation-rule-type.enum';
import { consolidationWriterService } from '../consolidation-writer.service';

import type { CanonicalTransferInputInterface } from '../../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutionResultInterface } from '../../interface/consolidation-execution-result.interface';
import type { ConsolidationRuleInterface } from '../../interface/consolidation-rule.interface';
import type { ConsolidationSourceMoveRequestInterface } from '../../interface/consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from '../../interface/consolidation-tag-copy-request.interface';
import type { AtmCashWithdrawalCandidateInterface, DB } from '@budgie/contracts';

class AtmCashWithdrawalConsolidationService implements ConsolidationRuleInterface<AtmCashWithdrawalCandidateInterface> {
    readonly priority = 70;
    readonly type = ConsolidationRuleTypeEnum.ATM_CASH_WITHDRAWAL;

    @Log('enter', result => `done count=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async findCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return transferPairRepository.findAtmCashWithdrawalCandidates();
    }

    @Log(
        candidate =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (result, candidate) =>
            `done transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: AtmCashWithdrawalCandidateInterface): number[] {
        return [candidate.transactionId];
    }

    @Log(
        (candidate, tx) =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: AtmCashWithdrawalCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);
        const sourceTransactions = await consolidationWriterService.findEligibleSourceTransactions(sourceTransactionIds, tx);

        if (!isDefined(sourceTransactions)) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        const canonicalInput = this.buildCanonicalInput(candidate);
        const canonicalTransaction = await consolidationWriterService.createCanonicalTransfer(canonicalInput, tx);

        await consolidationWriterService.createAtmCashWithdrawalFeeEntry(candidate, sourceTransactions, canonicalTransaction.id, tx);

        return { canonicalTransactionId: canonicalTransaction.id, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: AtmCashWithdrawalCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationSourceMoveRequestInterface[] {
        if (!isDefined(result.canonicalTransactionId)) {
            return [];
        }

        return [
            {
                destinationTransactionId: result.canonicalTransactionId,
                sourceTransactionIds: this.getSourceTransactionIds(candidate)
            }
        ];
    }

    @Log(
        (candidate, result) =>
            `enter transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw transactionId=${candidate.transactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: AtmCashWithdrawalCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }

    @Log(
        candidate =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (result, candidate) =>
            `done transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} title="${result.title}" fromAccountId=${result.fromAccountId} toAccountId=${result.toAccountId}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} error=${getErrorMessage(error)}`
    )
    private buildCanonicalInput(candidate: AtmCashWithdrawalCandidateInterface): CanonicalTransferInputInterface {
        return {
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
    }
}

export const atmCashWithdrawalConsolidationService = new AtmCashWithdrawalConsolidationService();
