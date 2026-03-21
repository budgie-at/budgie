import { LlmInterface, buildCommentContext } from '@budgie/ai';
import { UnembeddedCommentDataInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { commentEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { BatchConfigInterface } from '../interface/batch-config.interface';
import { ProgressCallbackInterface } from '../interface/progress-callback.interface';

import { parseTagIds } from './parse-tag-ids.util';
import { processEmbeddingBatches } from './process-embedding-batches.util';

interface CommentContextDataInterface {
    readonly comment: string;
    readonly categoryId: number;
    readonly tagIds: number[];
    readonly context: string;
}

const buildCommentContextItem = (row: UnembeddedCommentDataInterface): CommentContextDataInterface | null => {
    const context = buildCommentContext({ comment: row.comment, categoryTitle: row.categoryTitleEn });

    if (!isNotEmptyString(context)) {
        return null;
    }

    return { comment: row.comment, categoryId: row.categoryId, tagIds: parseTagIds(row.tagIds), context };
};

const commentBatchConfig: BatchConfigInterface<UnembeddedCommentDataInterface, CommentContextDataInterface> = {
    fetchBatch: (limit, cursor) => commentEmbeddingRepository.findMissingTransactionData(limit, cursor),
    buildContextData: rows => rows.map(buildCommentContextItem).filter(isDefined),
    getContextKey: item => `${item.comment}|${item.categoryId}`,
    upsertEmbedding: (item, serialized, dimensions) =>
        commentEmbeddingRepository.upsert({ comment: item.comment, categoryId: item.categoryId, embedding: serialized, dimensions }),
    replaceTags: (embeddingId, tagIds) => commentEmbeddingRepository.replaceTags(embeddingId, tagIds),
    getCursor: batch => batch[batch.length - 1].maxOperatedAt
};

export const processCommentBatches = async (
    llm: LlmInterface,
    existingKeys: Set<string>,
    callbacks: ProgressCallbackInterface
): Promise<void> => processEmbeddingBatches(llm, existingKeys, callbacks, commentBatchConfig);
