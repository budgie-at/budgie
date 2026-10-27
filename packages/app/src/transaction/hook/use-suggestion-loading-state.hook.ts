import { SuggestionStatus } from '@budgie/ai';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { delayedFlagAtom } from '../../@generic/constant/delayed-flag-atom.constant';

const LOADING_DELAY_MS = 400;

interface UseSuggestionLoadingStateParams {
    readonly status: SuggestionStatus;
    readonly hasResults: boolean;
    readonly enabled: boolean;
}

interface UseSuggestionLoadingStateReturn {
    readonly showLoading: boolean;
    readonly showContent: boolean;
    readonly isProcessing: boolean;
}

export const useSuggestionLoadingState = (params: UseSuggestionLoadingStateParams): UseSuggestionLoadingStateReturn => {
    const { status, hasResults, enabled } = params;

    const isProcessing = status === 'initializing' || status === 'loading';
    const isReady = status === 'success' && hasResults;

    const showLoading = useAtomValue(delayedFlagAtom([isProcessing, LOADING_DELAY_MS]));

    const showLoadingIndicator = showLoading && !isReady;
    const showContent = enabled && (showLoadingIndicator || isReady);

    return { showLoading: showLoadingIndicator, showContent, isProcessing };
};
