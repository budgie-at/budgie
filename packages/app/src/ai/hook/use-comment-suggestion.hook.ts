import { UseSuggestionReturnInterface } from '@budgie/ai';
import { getLogger } from '@budgie/logger';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';

const logger = getLogger('useCommentSuggestion');

import { useEmbedding } from './use-embedding.hook';
import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseCommentSuggestionParams {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
}

export const useCommentSuggestion = (params: UseCommentSuggestionParams): UseSuggestionReturnInterface<string> => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const { status: embeddingStatus } = useEmbedding();
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const fetchSuggestions = async (): Promise<string[]> => {
        const mccDescription = mccCategory?.fullDescription ?? null;
        logger.log('hook:suggestion:comment:fetch:start', {
            transactionTitle,
            categoryId,
            mccCategoryId,
            mccDescription,
            comment,
            aiContext
        });
        const results = await embeddingSuggestionService.suggestComments(categoryId, transactionTitle, mccDescription, comment, aiContext);
        logger.log('hook:suggestion:comment:fetch:done', { count: results.length });

        return results;
    };

    logger.log('hook:suggestion:comment:hook:state', {
        enabled,
        embeddingStatus,
        embeddingReady,
        isMccLoading
    });

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading],
        requestKeyParts: [transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, embeddingReady],
        fetchSuggestions
    });

    return { status, suggestions };
};
