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
import type { ConsolidationScanScopeInterface, DB, TransferPairCandidateInterface } from '@budgie/contracts';

class TransferPairConsolidationService implements ConsolidationRuleInterface<TransferPairCandidateInterface> {
    readonly priority = 60;
    readonly type = ConsolidationRuleTypeEnum.TRANSFER_PAIR;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<TransferPairCandidateInterface[]> {
        return transferPairRepository.findCandidates(scope);
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: TransferPairCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }

    @Log(
        (candidate, tx) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: TransferPairCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
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
        candidate: TransferPairCandidateInterface,
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
        candidate: TransferPairCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket} expenseEntryAmount=${candidate.expenseEntryAmount} incomeEntryAmount=${candidate.incomeEntryAmount}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket} expenseEntryAmount=${candidate.expenseEntryAmount} incomeEntryAmount=${candidate.incomeEntryAmount} exchangeRate=${result}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket} expenseEntryAmount=${candidate.expenseEntryAmount} incomeEntryAmount=${candidate.incomeEntryAmount} error=${getErrorMessage(error)}`
    )
    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE' || candidate.confidenceBucket === 'AUTO_INTERBANK_HINTED_FEE') {
            return 1;
        }

        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket} consolidationType=${result}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} confidenceBucket=${candidate.confidenceBucket} error=${getErrorMessage(error)}`
    )
    private getPairConsolidationType(candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE') {
            return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
        }

        return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} title="${result.title}" fromAccountId=${result.fromAccountId} toAccountId=${result.toAccountId} fromAmount=${result.fromAmount} toAmount=${result.toAmount} exchangeRate=${result.exchangeRate} consolidationType=${result.consolidationType}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} confidenceBucket=${candidate.confidenceBucket} error=${getErrorMessage(error)}`
    )
    private buildCanonicalInput(candidate: TransferPairCandidateInterface): CanonicalTransferInputInterface {
        return {
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
    }
}

export const transferPairConsolidationService = new TransferPairConsolidationService();
