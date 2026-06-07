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
import type { ConsolidationScanScopeInterface, DB, ExistingTransferBridgeCandidateInterface } from '@budgie/contracts';

class ExistingTransferBridgeConsolidationService implements ConsolidationRuleInterface<ExistingTransferBridgeCandidateInterface> {
    readonly priority = 20;
    readonly type = ConsolidationRuleTypeEnum.EXISTING_TRANSFER_BRIDGE;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<ExistingTransferBridgeCandidateInterface[]> {
        return transferPairRepository.findExistingTransferBridgeCandidates(scope);
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId}`,
        (result, candidate) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: ExistingTransferBridgeCandidateInterface): number[] {
        return [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId];
    }

    @Log(
        (candidate, tx) =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: ExistingTransferBridgeCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);
        const allowedMovedSourceTransactionIds = [candidate.existingTransferId];

        if (!(await consolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx, allowedMovedSourceTransactionIds))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        const canonicalInput = this.buildCanonicalInput(candidate);
        const canonicalTransaction = await consolidationWriterService.createCanonicalTransfer(canonicalInput, tx);

        return { canonicalTransactionId: canonicalTransaction.id, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: ExistingTransferBridgeCandidateInterface,
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
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: ExistingTransferBridgeCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} title="${result.title}" fromAccountId=${result.fromAccountId} toAccountId=${result.toAccountId}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    private buildCanonicalInput(candidate: ExistingTransferBridgeCandidateInterface): CanonicalTransferInputInterface {
        return {
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
    }
}

export const existingTransferBridgeConsolidationService = new ExistingTransferBridgeConsolidationService();
