export type SuggestionInternalStatus = 'idle' | 'loading' | 'success' | 'error';
export type SuggestionStatus = 'idle' | 'initializing' | 'loading' | 'success' | 'error';

export interface UseSuggestionReturnInterface<T> {
    status: SuggestionStatus;
    suggestions: T[];
}
