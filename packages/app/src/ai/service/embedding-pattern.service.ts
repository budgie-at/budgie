import {
    EmbeddingContextResultInterface,
    RepeatedTransactionPatternInterface,
    TitleEmbeddingEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { titleEmbeddingRepository, transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { EMBEDDING_RECENT_TITLE_COUNT, EMBEDDING_SIMILARITY_THRESHOLD } from '../constant/embedding.constant';
import { cosineSimilarity } from '../util/cosine-similarity.util';
import { deserializeEmbedding } from '../util/deserialize-embedding.util';

interface FindSimilarPatternsParamsInterface {
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}

interface ContextEmbeddingDataInterface {
    readonly title: string;
    readonly embedding: Float32Array;
}

class EmbeddingPatternService {
    async findSimilarPatterns(params: FindSimilarPatternsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const allEmbeddings = await titleEmbeddingRepository.findAll();

        if (!isNotEmptyArray(allEmbeddings)) {
            return [];
        }

        const recentContexts = await titleEmbeddingRepository.findRecentContexts(EMBEDDING_RECENT_TITLE_COUNT);

        if (!isNotEmptyArray(recentContexts)) {
            return [];
        }

        const similarTitles = this.findSimilarTitles(recentContexts, allEmbeddings);

        if (!isNotEmptyArray(similarTitles)) {
            return [];
        }

        return transactionPatternRepository.findPatternsByTitles({
            titles: similarTitles,
            type: params.type,
            ...(isDefined(params.accountId) && { accountId: params.accountId }),
            ...(isDefined(params.amountMin) && { amountMin: params.amountMin }),
            ...(isDefined(params.amountMax) && { amountMax: params.amountMax }),
            ...(isDefined(params.limit) && { limit: params.limit })
        });
    }

    private findSimilarTitles(recentContexts: EmbeddingContextResultInterface[], allEmbeddings: TitleEmbeddingEntityInterface[]): string[] {
        const embeddingDataByContext = this.buildEmbeddingDataMap(allEmbeddings);
        const similarTitleSet = new Set<string>();

        for (const recent of recentContexts) {
            const recentData = embeddingDataByContext.get(recent.context);

            if (isDefined(recentData)) {
                this.collectSimilarTitles(recent.context, recentData.embedding, embeddingDataByContext, similarTitleSet);
            }
        }

        return [...similarTitleSet];
    }

    private buildEmbeddingDataMap(allEmbeddings: TitleEmbeddingEntityInterface[]): Map<string, ContextEmbeddingDataInterface> {
        const embeddingDataByContext = new Map<string, ContextEmbeddingDataInterface>();

        for (const row of allEmbeddings) {
            embeddingDataByContext.set(row.context, {
                title: row.title,
                embedding: deserializeEmbedding(row.embedding)
            });
        }

        return embeddingDataByContext;
    }

    private collectSimilarTitles(
        recentContext: string,
        recentEmbedding: Float32Array,
        embeddingDataByContext: Map<string, ContextEmbeddingDataInterface>,
        similarTitleSet: Set<string>
    ): void {
        for (const [context, data] of embeddingDataByContext) {
            if (context !== recentContext && cosineSimilarity(recentEmbedding, data.embedding) >= EMBEDDING_SIMILARITY_THRESHOLD) {
                similarTitleSet.add(data.title);
            }
        }
    }
}

export const embeddingPatternService = new EmbeddingPatternService();
