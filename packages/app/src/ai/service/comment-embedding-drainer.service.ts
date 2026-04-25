import { buildCommentContext } from '@budgie/ai';

import { commentEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';

import type { CommentPendingContextInterface, DB } from '@budgie/contracts';

class CommentEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<CommentPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_COMMENT;

    protected buildPromptContext(context: CommentPendingContextInterface): string {
        return buildCommentContext({
            comment: context.comment,
            categoryTitle: context.categoryTitleEn
        });
    }

    protected async persistEmbedding(
        context: CommentPendingContextInterface,
        embedding: Uint8Array,
        dimensions: number
    ): Promise<number | null> {
        return commentEmbeddingRepository.upsert({
            comment: context.comment,
            categoryId: context.categoryId,
            embedding,
            dimensions
        });
    }

    protected async fetchPending(limit: number): Promise<CommentPendingContextInterface[]> {
        return commentEmbeddingRepository.findPendingCommentContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return commentEmbeddingRepository.countPendingCommentContexts();
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return commentEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const commentEmbeddingDrainerService = new CommentEmbeddingDrainerService();
