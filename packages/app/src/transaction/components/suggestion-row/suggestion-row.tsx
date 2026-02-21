import { SuggestionStatus } from '@budgie/ai';
import { ReactNode } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { SuggestionRowLayout } from '../suggestion-row-layout/suggestion-row-layout';

interface Props<T> {
    readonly suggestions: T[];
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly renderPill: (item: T, index: number, onSelect: () => void) => ReactNode;
    readonly onSelect: (item: T) => void;
}

export const SuggestionRow = <T,>(props: Props<T>) => {
    const { suggestions, status, enabled, renderPill, onSelect } = props;

    const { showLoading, showContent, isProcessing } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(suggestions),
        enabled
    });

    return (
        <SuggestionRowLayout showContent={showContent} showLoading={showLoading} isProcessing={isProcessing}>
            {[...suggestions].reverse().map((item, index) => renderPill(item, index, () => void onSelect(item)))}
        </SuggestionRowLayout>
    );
};
