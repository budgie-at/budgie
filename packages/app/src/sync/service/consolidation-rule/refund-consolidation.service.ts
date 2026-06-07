import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { refundPairRepository } from '../../../@generic/drizzle/db/db';
import { ConsolidationRuleTypeEnum } from '../../enum/consolidation-rule-type.enum';
import { consolidationWriterService } from '../consolidation-writer.service';

import type { ConsolidationExecutionResultInterface } from '../../interface/consolidation-execution-result.interface';
import type { ConsolidationRuleInterface } from '../../interface/consolidation-rule.interface';
import type { ConsolidationSourceMoveRequestInterface } from '../../interface/consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from '../../interface/consolidation-tag-copy-request.interface';
import type { ConsolidationScanScopeInterface, DB, RefundCandidateInterface } from '@budgie/contracts';

class RefundConsolidationService implements ConsolidationRuleInterface<RefundCandidateInterface> {
    readonly priority = 80;
    readonly type = ConsolidationRuleTypeEnum.REFUND;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<RefundCandidateInterface[]> {
        return refundPairRepository.findCandidates(scope);
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: RefundCandidateInterface): number[] {
        return [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];
    }

    @Log(
        (candidate, tx) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: RefundCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);

        if (!(await consolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        await consolidationWriterService.setConsolidationType(candidate.expenseTransactionId, TransactionConsolidationTypeEnum.REFUND, tx);

        return { canonicalTransactionId: candidate.expenseTransactionId, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: RefundCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationSourceMoveRequestInterface[] {
        if (!isDefined(result.canonicalTransactionId)) {
            return [];
        }

        return [
            {
                destinationTransactionId: result.canonicalTransactionId,
                sourceTransactionIds: candidate.refundIncomeTransactionIds
            }
        ];
    }

    @Log(
        (candidate, result) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: RefundCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (!isDefined(result.canonicalTransactionId)) {
            return [];
        }

        return [
            {
                destinationTransactionId: result.canonicalTransactionId,
                sourceTransactionIds: candidate.refundIncomeTransactionIds
            }
        ];
    }
}

export const refundConsolidationService = new RefundConsolidationService();
