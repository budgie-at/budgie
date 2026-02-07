import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_RECENT_TITLE_COUNT, EMBEDDING_VEC_PATTERN_SEARCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { EmbeddingPatternRepositoryInterface } from '../interface/embedding-pattern-repository.interface';
import { FindSimilarPatternsParamsInterface } from '../interface/find-similar-patterns-params.interface';
import { TransactionPatternRepositoryInterface } from '../interface/transaction-pattern-repository.interface';

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

        const similarTitles = this.embeddingRepository.findSimilarTitlesByContexts(contextEmbeddings, EMBEDDING_VEC_PATTERN_SEARCH_LIMIT);

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
        const contexts = recentContexts.map(recent => recent.context);
        const embeddingMap = await this.embeddingRepository.findEmbeddingsByContexts(contexts);

        return recentContexts
            .map(recent => {
                const embedding = embeddingMap.get(recent.context);

                if (!isDefined(embedding)) {
                    return null;
                }

                return { context: recent.context, embedding };
            })
            .filter(isDefined);
    }
}
