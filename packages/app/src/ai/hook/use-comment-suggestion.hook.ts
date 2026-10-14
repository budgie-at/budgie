import { UseSuggestionReturnInterface } from '@budgie/ai';
import { EmbeddingSuggestionService } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSetting } from '../../settings/hook/use-setting.hook';
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
    const { transactionTitle: title, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const isCommentSuggestionEnabled = useSetting('isAiSuggestionsEnabled');
    const modelStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const isModelReady = modelStatus === AiSubsystemStatusEnum.READY;
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const fetchSuggestions = () => {
        const mccDescription = mccCategory?.fullDescription ?? null;

        return Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
            embeddingSuggestionService.suggestComments(categoryId, title, mccDescription, comment, aiContext)
        );
    };

    const { status, suggestions } = useSuggestionBase({
        enabled: enabled && isCommentSuggestionEnabled,
        readyChecks: [isModelReady, !isMccLoading],
        requestKeyParts: [title, categoryId, mccCategoryId, comment, aiContext, enabled, isCommentSuggestionEnabled, isModelReady],
        fetchSuggestions
    });

    return { status, suggestions };
};
