import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { ConsolidationSourceMoveRequestInterface } from '../interface/consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from '../interface/consolidation-tag-copy-request.interface';
import type { DB, TransactionTagsEntityInterface } from '@budgie/contracts';

class ConsolidationSideEffectService {
    @Log(
        (requests, tx) =>
            `enter requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, requests, tx) =>
            `done requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, requests, tx) =>
            `throw requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async moveSources(requests: ConsolidationSourceMoveRequestInterface[], tx: DB): Promise<boolean> {
        await requests.reduce(async (movePromise, request) => {
            await movePromise;
            await transactionEntryRepository.moveToConsolidatedTransaction(
                request.sourceTransactionIds,
                request.destinationTransactionId,
                tx
            );
            await transactionRepository.setConsolidationParent(request.sourceTransactionIds, request.destinationTransactionId, tx);
        }, Promise.resolve());

        return true;
    }

    @Log(
        (requests, tx) =>
            `enter requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, requests, tx) =>
            `done requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))} copied=${String(result)}`,
        (error, requests, tx) =>
            `throw requestDestinations=${requests.map(request => request.destinationTransactionId).join(',')} requestSourceIds=${requests.map(request => request.sourceTransactionIds.join(':')).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async copyTags(requests: ConsolidationTagCopyRequestInterface[], tx: DB): Promise<boolean> {
        await requests.reduce(async (copyPromise, request) => {
            await copyPromise;
            await this.copyRequestTags(request, tx);
        }, Promise.resolve());

        return true;
    }

    private async copyRequestTags(request: ConsolidationTagCopyRequestInterface, tx: DB): Promise<void> {
        const sourceTags = await this.findSourceTags(request.sourceTransactionIds, tx);
        const existingTags = await transactionTagsRepository.findByTransactionId(request.destinationTransactionId, tx);
        const existingTagIds = new Set(existingTags.map(tag => tag.tagId));
        const uniqueTagIds = [...new Set(sourceTags.map(tag => tag.tagId))].filter(tagId => !existingTagIds.has(tagId));

        if (isEmptyArray(uniqueTagIds)) {
            return;
        }

        await transactionTagsRepository.bulkCreate(
            uniqueTagIds.map(tagId => ({
                transactionId: request.destinationTransactionId,
                tagId,
                isPrimary: false
            })),
            tx
        );
    }

    private async findSourceTags(sourceTransactionIds: number[], tx: DB): Promise<TransactionTagsEntityInterface[]> {
        if (!isNotEmptyArray(sourceTransactionIds)) {
            return [];
        }

        const tagCollections = await Promise.all(
            sourceTransactionIds.map(async transactionId => transactionTagsRepository.findByTransactionId(transactionId, tx))
        );

        return tagCollections.flat();
    }
}

export const consolidationSideEffectService = new ConsolidationSideEffectService();
