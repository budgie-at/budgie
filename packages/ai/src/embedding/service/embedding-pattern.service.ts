import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_RECENT_TITLE_COUNT } from '../../@generic/constant/embedding.constant';
import { EmbeddingPatternRepositoryInterface } from '../interface/embedding-pattern-repository.interface';
import { FindSimilarPatternsParamsInterface } from '../interface/find-similar-patterns-params.interface';
import { TransactionPatternRepositoryInterface } from '../interface/transaction-pattern-repository.interface';

const VEC_PATTERN_SEARCH_LIMIT = 10;

export class EmbeddingPatternService {
    constructor(
        private readonly embeddingRepository: EmbeddingPatternRepositoryInterface,
        private readonly patternRepository: TransactionPatternRepositoryInterface
    ) {}

    async findSimilarPatterns(params: FindSimilarPatternsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const recentContexts = await this.embeddingRepository.findRecentContexts(EMBEDDING_RECENT_TITLE_COUNT);

        if (!isNotEmptyArray(recentContexts)) {
            return [];
        }

        const contextEmbeddings = await this.buildContextEmbeddings(recentContexts);

        if (!isNotEmptyArray(contextEmbeddings)) {
            return [];
        }

        const similarTitles = this.embeddingRepository.findSimilarTitlesByContexts(contextEmbeddings, VEC_PATTERN_SEARCH_LIMIT);

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

    private async buildContextEmbeddings(recentContexts: { context: string }[]): Promise<{ context: string; embedding: Uint8Array }[]> {
        const results: { context: string; embedding: Uint8Array }[] = [];

        for (const recent of recentContexts) {
            const embedding = await this.embeddingRepository.findEmbeddingByContext(recent.context); // eslint-disable-line no-await-in-loop -- Sequential DB lookups for each recent context

            if (isDefined(embedding)) {
                results.push({ context: recent.context, embedding });
            }
        }

        return results;
    }
}
