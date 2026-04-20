import { buildCommentContext, serializeEmbedding } from '@budgie/ai';
import { CommentPendingContextInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { commentEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { aiLog } from '../utils/ai-log.util';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';
import { embeddingService } from './embedding.service';

import type { DB } from '@budgie/contracts';

class CommentEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<CommentPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_COMMENT;
    protected readonly logDomain = 'drainer:embedding:comment';

    protected async fetchPending(limit: number): Promise<readonly CommentPendingContextInterface[]> {
        return commentEmbeddingRepository.findPendingCommentContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return commentEmbeddingRepository.countPendingCommentContexts();
    }

    protected logBegin(context: CommentPendingContextInterface): void {
        aiLog('drainer:embedding:comment:context:begin', {
            categoryId: context.categoryId,
            contextSize: context.transactionIds.length,
            hasExisting: isDefined(context.existingEmbeddingId)
        });
    }

    protected async runEmbedAndUpsert(context: CommentPendingContextInterface): Promise<number | null> {
        const promptContext = buildCommentContext({
            comment: context.comment,
            categoryTitle: context.categoryTitleEn
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            aiLog('drainer:embedding:comment:context:skip', {
                reason: 'empty-embedding',
                contextSize: context.transactionIds.length
            });

            return null;
        }

        aiLog('drainer:embedding:comment:context:embedded', {
            dimensions: rawEmbedding.length,
            contextSize: context.transactionIds.length
        });

        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));
        const embeddingId = await commentEmbeddingRepository.upsert({
            comment: context.comment,
            categoryId: context.categoryId,
            embedding: serialized,
            dimensions: rawEmbedding.length
        });
        if (!isDefined(embeddingId)) {
            aiLog('drainer:embedding:comment:context:skip', {
                reason: 'upsert-null',
                contextSize: context.transactionIds.length
            });
        }

        return embeddingId;
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return commentEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const commentEmbeddingDrainerService = new CommentEmbeddingDrainerService();
