import { RepeatedTransactionPatternInterface, TitleEmbeddingEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

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

class EmbeddingPatternService {
    async findSimilarPatterns(params: FindSimilarPatternsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const allEmbeddings = await titleEmbeddingRepository.findAll();

        if (!isNotEmptyArray(allEmbeddings)) {
            return [];
        }

        const recentTitles = await titleEmbeddingRepository.findRecentTitles(EMBEDDING_RECENT_TITLE_COUNT);

        if (!isNotEmptyArray(recentTitles)) {
            return [];
        }

        const similarTitles = this.findSimilarTitles(recentTitles, allEmbeddings);

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

    private findSimilarTitles(recentTitles: string[], allEmbeddings: TitleEmbeddingEntityInterface[]): string[] {
        const embeddingByTitle = this.buildEmbeddingMap(allEmbeddings);
        const similarTitleSet = new Set<string>();

        for (const recentTitle of recentTitles) {
            const recentEmbedding = embeddingByTitle.get(recentTitle);

            if (isDefined(recentEmbedding)) {
                this.collectSimilarTitles(recentTitle, recentEmbedding, embeddingByTitle, similarTitleSet);
            }
        }

        return [...similarTitleSet];
    }

    private buildEmbeddingMap(allEmbeddings: TitleEmbeddingEntityInterface[]): Map<string, Float32Array> {
        const embeddingByTitle = new Map<string, Float32Array>();

        for (const row of allEmbeddings) {
            embeddingByTitle.set(row.title, deserializeEmbedding(row.embedding));
        }

        return embeddingByTitle;
    }

    private collectSimilarTitles(
        recentTitle: string,
        recentEmbedding: Float32Array,
        embeddingByTitle: Map<string, Float32Array>,
        similarTitleSet: Set<string>
    ): void {
        for (const [title, titleEmbedding] of embeddingByTitle) {
            if (title !== recentTitle && cosineSimilarity(recentEmbedding, titleEmbedding) >= EMBEDDING_SIMILARITY_THRESHOLD) {
                similarTitleSet.add(title);
            }
        }
    }
}

export const embeddingPatternService = new EmbeddingPatternService();
