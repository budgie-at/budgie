import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transferPairRepository } from '../../../@generic/drizzle/db/db';
import { ConsolidationRuleTypeEnum } from '../../enum/consolidation-rule-type.enum';
import { consolidationWriterService } from '../consolidation-writer.service';

import type { ConsolidationExecutionResultInterface } from '../../interface/consolidation-execution-result.interface';
import type { ConsolidationRuleInterface } from '../../interface/consolidation-rule.interface';
import type { ConsolidationSourceMoveRequestInterface } from '../../interface/consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from '../../interface/consolidation-tag-copy-request.interface';
import type { DB, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

class ExistingTransferIncomeDuplicateConsolidationService implements ConsolidationRuleInterface<ExistingTransferIncomeDuplicateCandidateInterface> {
    readonly priority = 50;
    readonly type = ConsolidationRuleTypeEnum.EXISTING_TRANSFER_INCOME_DUPLICATE;

    @Log('enter', result => `done count=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async findCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        return transferPairRepository.findExistingTransferIncomeDuplicateCandidates();
    }

    @Log(
        candidate =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} targetEntryId=${candidate.existingTransferTargetEntryId}`,
        (result, candidate) =>
            `done existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceTransactionIds=${result.join(',')}`,
        (error, candidate) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} targetEntryId=${candidate.existingTransferTargetEntryId} error=${getErrorMessage(error)}`
    )
    getSourceTransactionIds(candidate: ExistingTransferIncomeDuplicateCandidateInterface): number[] {
        return [candidate.incomeTransactionId];
    }

    @Log(
        (candidate, tx) =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (error, candidate, tx) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async consolidate(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<ConsolidationExecutionResultInterface> {
        const sourceTransactionIds = this.getSourceTransactionIds(candidate);

        if (!(await consolidationWriterService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        if (!(await consolidationWriterService.isExistingTransferStillEligible(candidate.existingTransferId, tx))) {
            return { canonicalTransactionId: null, consolidated: false };
        }

        await consolidationWriterService.updateExistingTransferIncomeDuplicate(candidate, tx);

        return { canonicalTransactionId: candidate.existingTransferId, consolidated: true };
    }

    @Log(
        (candidate, result) =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')}`,
        (error, candidate, result) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildSourceMoveRequests(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
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
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''}`,
        (requests, candidate, result) =>
            `done existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} requestCount=${requests.length}`,
        (error, candidate, result) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} consolidated=${String(result.consolidated)} canonicalTransactionId=${result.canonicalTransactionId ?? ''} error=${getErrorMessage(error)}`
    )
    buildTagCopyRequests(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        result: ConsolidationExecutionResultInterface
    ): ConsolidationTagCopyRequestInterface[] {
        if (isDefined(result.canonicalTransactionId)) {
            this.getSourceTransactionIds(candidate);
        }

        return [];
    }
}

export const existingTransferIncomeDuplicateConsolidationService = new ExistingTransferIncomeDuplicateConsolidationService();
