import { buildCommentContext, serializeEmbedding } from '@budgie/ai';
import { Log, getLogger } from '@budgie/contracts';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { commentEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';
import { embeddingService } from './embedding.service';

import type { CommentPendingContextInterface, DB } from '@budgie/contracts';

const commentDrainerLogger = getLogger('CommentEmbeddingDrainerService');

class CommentEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<CommentPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_COMMENT;
    protected readonly logDomain = 'drainer:embedding:comment';

    @Log(
        context => `enter contextSize=${context.transactionIds.length}`,
        (result, context) => `done contextSize=${context.transactionIds.length} dimensions=${result.length}`,
        (error, context) => `throw contextSize=${context.transactionIds.length} error=${getErrorMessage(error)}`
    )
    private async embedCommentContext(context: CommentPendingContextInterface): Promise<number[]> {
        const promptContext = buildCommentContext({
            comment: context.comment,
            categoryTitle: context.categoryTitleEn
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            commentDrainerLogger.log('embedding:comment:context:skip', {
                reason: 'empty-embedding',
                contextSize: context.transactionIds.length
            });
        }

        return rawEmbedding;
    }

    @Log(
        context => `enter contextSize=${context.transactionIds.length}`,
        (result, context) => `done contextSize=${context.transactionIds.length} embeddingId=${String(result)}`,
        (error, context) => `throw contextSize=${context.transactionIds.length} error=${getErrorMessage(error)}`
    )
    private async upsertCommentEmbedding(context: CommentPendingContextInterface, rawEmbedding: number[]): Promise<number | null> {
        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));
        const embeddingId = await commentEmbeddingRepository.upsert({
            comment: context.comment,
            categoryId: context.categoryId,
            embedding: serialized,
            dimensions: rawEmbedding.length
        });
        if (!isDefined(embeddingId)) {
            commentDrainerLogger.log('embedding:comment:context:skip', {
                reason: 'upsert-null',
                contextSize: context.transactionIds.length
            });
        }

        return embeddingId;
    }

    protected async fetchPending(limit: number): Promise<CommentPendingContextInterface[]> {
        return commentEmbeddingRepository.findPendingCommentContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return commentEmbeddingRepository.countPendingCommentContexts();
    }

    protected logBegin(context: CommentPendingContextInterface): void {
        commentDrainerLogger.log('embedding:comment:context:begin', {
            categoryId: context.categoryId,
            contextSize: context.transactionIds.length,
            hasExisting: isDefined(context.existingEmbeddingId)
        });
    }

    protected async runEmbedAndUpsert(context: CommentPendingContextInterface): Promise<number | null> {
        const rawEmbedding = await this.embedCommentContext(context);
        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return this.upsertCommentEmbedding(context, rawEmbedding);
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return commentEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const commentEmbeddingDrainerService = new CommentEmbeddingDrainerService();
