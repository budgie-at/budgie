import { RepeatedTransactionPatternInterface, TitleEmbeddingRepository, TransactionPatternRepository } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_RECENT_TITLE_COUNT, EMBEDDING_VEC_PATTERN_SEARCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { FindSimilarPatternsParamsInterface } from '../interface/find-similar-patterns-params.interface';

export class EmbeddingPatternService {
    constructor(
        private readonly embeddingRepository: TitleEmbeddingRepository,
        private readonly patternRepository: TransactionPatternRepository
    ) {}

    // eslint-disable-next-line max-statements -- Debug logging
    async findSimilarPatterns(params: FindSimilarPatternsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const start = performance.now();
        console.log('[EmbedPattern] findSimilarPatterns START'); // eslint-disable-line no-console
        const recentContexts = await this.embeddingRepository.findRecentContexts(EMBEDDING_RECENT_TITLE_COUNT);
        // eslint-disable-next-line no-console
        console.log(`[EmbedPattern] recentContexts in ${(performance.now() - start).toFixed(0)}ms n=${recentContexts.length}`);

        if (!isNotEmptyArray(recentContexts)) {
            return [];
        }

        const contextEmbeddings = await this.buildContextEmbeddings(recentContexts);
        // eslint-disable-next-line no-console
        console.log(`[EmbedPattern] contextEmbeddings in ${(performance.now() - start).toFixed(0)}ms n=${contextEmbeddings.length}`);

        if (!isNotEmptyArray(contextEmbeddings)) {
            return [];
        }

        const similarTitles = await this.embeddingRepository.findSimilarTitlesByContexts(
            contextEmbeddings,
            EMBEDDING_VEC_PATTERN_SEARCH_LIMIT
        );
        // eslint-disable-next-line no-console
        console.log(`[EmbedPattern] similarTitles in ${(performance.now() - start).toFixed(0)}ms n=${similarTitles.length}`);

        if (!isNotEmptyArray(similarTitles)) {
            return [];
        }

        const patterns = await this.patternRepository.findPatternsByTitles({
            titles: similarTitles,
            type: params.type,
            ...(isDefined(params.accountId) && { accountId: params.accountId }),
            ...(isDefined(params.amountMin) && { amountMin: params.amountMin }),
            ...(isDefined(params.amountMax) && { amountMax: params.amountMax }),
            ...(isDefined(params.limit) && { limit: params.limit })
        });
        console.log(`[EmbedPattern] findPatternsByTitles done in ${(performance.now() - start).toFixed(0)}ms, patterns=${patterns.length}`); // eslint-disable-line no-console

        return patterns;
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
