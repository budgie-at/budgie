import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transferPairRepository } from '../../../@generic/drizzle/db/db';
import { ConsolidationRuleTypeEnum } from '../../enum/consolidation-rule-type.enum';
import { consolidationWriterService } from '../consolidation-writer.service';

import type { ConsolidationExecutionResultInterface } from '../../interface/consolidation-execution-result.interface';
import type { ConsolidationRuleInterface } from '../../interface/consolidation-rule.interface';
import type { ConsolidationSourceMoveRequestInterface } from '../../interface/consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from '../../interface/consolidation-tag-copy-request.interface';
import type { ConsolidationScanScopeInterface, DB, IbanBridgeCanonicalDuplicateCandidateInterface } from '@budgie/contracts';

class IbanBridgeCanonicalDuplicateConsolidationService implements ConsolidationRuleInterface<IbanBridgeCanonicalDuplicateCandidateInterface> {
    readonly priority = 30;
    readonly type = ConsolidationRuleTypeEnum.IBAN_BRIDGE_CANONICAL_DUPLICATE;

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} count=${result.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates(scope);
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId}`,
        (result, candidate) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): number[] {
        return [candidate.expenseTransactionId, candidate.incomeTransactionId];
    }

    @Log(
        (candidate, tx) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface, tx: DB): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);

        if (!(await consolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        return { canonicalTransactionId: candidate.existingCanonicalTransferId, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: IbanBridgeCanonicalDuplicateCandidateInterface,
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
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: IbanBridgeCanonicalDuplicateCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }
}

export const ibanBridgeCanonicalDuplicateConsolidationService = new IbanBridgeCanonicalDuplicateConsolidationService();
