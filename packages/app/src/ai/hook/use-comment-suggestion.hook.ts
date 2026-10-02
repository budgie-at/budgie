import { EmbeddingSuggestionService, UseSuggestionReturnInterface } from '@budgie/ai';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

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

    const embeddingStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const fetchSuggestions = () => {
        const mccDescription = mccCategory?.fullDescription ?? null;

        return Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
            embeddingSuggestionService.suggestComments(categoryId, transactionTitle, mccDescription, comment, aiContext)
        );
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading],
        requestKeyParts: [transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, embeddingReady],
        fetchSuggestions
    });

    return { status, suggestions };
};
