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
import type { ConsolidationScanScopeInterface, DB, IbanBridgeTransferCandidateInterface } from '@budgie/contracts';

class IbanBridgeTransferConsolidationService implements ConsolidationRuleInterface<IbanBridgeTransferCandidateInterface> {
    readonly priority = 40;
    readonly type = ConsolidationRuleTypeEnum.IBAN_BRIDGE_TRANSFER;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeTransferCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeTransferCandidates(scope);
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
    }

    @Log(
        (candidate, tx) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: IbanBridgeTransferCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);

        if (!(await consolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        const canonicalInput = this.buildCanonicalInput(candidate);
        const canonicalTransaction = await consolidationWriterService.createCanonicalTransfer(canonicalInput, tx);

        return { canonicalTransactionId: canonicalTransaction.id, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: IbanBridgeTransferCandidateInterface,
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
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: IbanBridgeTransferCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} title="${result.title}" fromAccountId=${result.fromAccountId} toAccountId=${result.toAccountId}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    private buildCanonicalInput(candidate: IbanBridgeTransferCandidateInterface): CanonicalTransferInputInterface {
        return {
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
    }
}

export const ibanBridgeTransferConsolidationService = new IbanBridgeTransferConsolidationService();
