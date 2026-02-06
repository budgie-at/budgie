import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_RECENT_TITLE_COUNT, EMBEDDING_SIMILARITY_THRESHOLD } from '../../@generic/constant/embedding.constant';
import { cosineSimilarity } from '../../@generic/util/cosine-similarity.util';
import { deserializeEmbedding } from '../../@generic/util/deserialize-embedding.util';
import { EmbeddingPatternRepositoryInterface } from '../interface/embedding-pattern-repository.interface';
import { FindSimilarPatternsParamsInterface } from '../interface/find-similar-patterns-params.interface';
import { TransactionPatternRepositoryInterface } from '../interface/transaction-pattern-repository.interface';

interface ContextEmbeddingDataInterface {
    readonly title: string;
    readonly embedding: Float32Array;
}

export class EmbeddingPatternService {
    constructor(
        private readonly embeddingRepository: EmbeddingPatternRepositoryInterface,
        private readonly patternRepository: TransactionPatternRepositoryInterface
    ) {}

    async findSimilarPatterns(params: FindSimilarPatternsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const allEmbeddings = await this.embeddingRepository.findAll();

        if (!isNotEmptyArray(allEmbeddings)) {
            return [];
        }

        const recentContexts = await this.embeddingRepository.findRecentContexts(EMBEDDING_RECENT_TITLE_COUNT);

        if (!isNotEmptyArray(recentContexts)) {
            return [];
        }

        const similarTitles = this.findSimilarTitles(recentContexts, allEmbeddings);

        if (!isNotEmptyArray(similarTitles)) {
            return [];
        }

        return this.patternRepository.findPatternsByTitles({
            titles: similarTitles,
            type: params.type,
            ...(isDefined(params.accountId) && { accountId: params.accountId }),
            ...(isDefined(params.amountMin) && { amountMin: params.amountMin }),
            ...(isDefined(params.amountMax) && { amountMax: params.amountMax }),
            ...(isDefined(params.limit) && { limit: params.limit })
        });
    }

    private findSimilarTitles(
        recentContexts: { context: string }[],
        allEmbeddings: { title: string; context: string; embedding: Buffer }[]
    ): string[] {
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

    private buildEmbeddingDataMap(
        allEmbeddings: { title: string; context: string; embedding: Buffer }[]
    ): Map<string, ContextEmbeddingDataInterface> {
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
