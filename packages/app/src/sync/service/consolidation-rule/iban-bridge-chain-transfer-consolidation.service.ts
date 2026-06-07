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
import type { ConsolidationScanScopeInterface, DB, IbanBridgeChainTransferCandidateInterface } from '@budgie/contracts';

class IbanBridgeChainTransferConsolidationService implements ConsolidationRuleInterface<IbanBridgeChainTransferCandidateInterface> {
    readonly priority = 10;
    readonly type = ConsolidationRuleTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeChainTransferCandidates(scope);
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId}`,
        (result, candidate) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: IbanBridgeChainTransferCandidateInterface): number[] {
        return [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];
    }

    @Log(
        (candidate, tx) =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: IbanBridgeChainTransferCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
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
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: IbanBridgeChainTransferCandidateInterface,
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
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: IbanBridgeChainTransferCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} title="${result.title}" fromAccountId=${result.fromAccountId} toAccountId=${result.toAccountId}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    private buildCanonicalInput(candidate: IbanBridgeChainTransferCandidateInterface): CanonicalTransferInputInterface {
        return {
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
    }
}

export const ibanBridgeChainTransferConsolidationService = new IbanBridgeChainTransferConsolidationService();
