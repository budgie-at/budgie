import { EmbeddingInvokerInterface, buildMerchantContext } from '@budgie/ai';
import { UnembeddedMerchantDataInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { BatchConfigInterface } from '../interface/batch-config.interface';
import { ProgressCallbackInterface } from '../interface/progress-callback.interface';

import { parseTagIds } from './parse-tag-ids.util';
import { processEmbeddingBatches } from './process-embedding-batches.util';

interface MerchantContextDataInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly categoryId: number;
    readonly comment: string;
    readonly tagIds: number[];
    readonly context: string;
}

const buildMerchantContextItem = (row: UnembeddedMerchantDataInterface): MerchantContextDataInterface | null => {
    const context = buildMerchantContext({ title: row.title, mccDescription: row.mccDescription, categoryTitle: row.categoryTitleEn });

    if (!isNotEmptyString(context)) {
        return null;
    }

    return {
        title: row.title,
        mccDescription: row.mccDescription,
        categoryId: row.categoryId,
        comment: row.comment,
        tagIds: parseTagIds(row.tagIds),
        context
    };
};

const merchantBatchConfig: BatchConfigInterface<UnembeddedMerchantDataInterface, MerchantContextDataInterface> = {
    fetchBatch: (limit, cursor) => merchantEmbeddingRepository.findTransactionData(limit, cursor),
    buildContextData: rows => rows.map(buildMerchantContextItem).filter(isDefined),
    getContextKey: item => `${item.title}|${item.mccDescription}|${item.categoryId}`,
    upsertEmbedding: async (item, serialized, dimensions) =>
        merchantEmbeddingRepository.upsert({
            title: item.title,
            mccDescription: item.mccDescription,
            categoryId: item.categoryId,
            comment: item.comment,
            embedding: serialized,
            dimensions
        }),
    replaceTags: (embeddingId, tagIds) => merchantEmbeddingRepository.replaceTags(embeddingId, tagIds),
    getCursor: batch => batch[batch.length - 1].maxOperatedAt
};

export const processMerchantBatches = async (
    embedding: EmbeddingInvokerInterface,
    existingKeys: Set<string>,
    callbacks: ProgressCallbackInterface
): Promise<void> => processEmbeddingBatches(embedding, existingKeys, callbacks, merchantBatchConfig);
