import { SuggestionStatus } from './suggestion-status.type';

export interface UseSuggestionReturnInterface<T> {
    readonly status: SuggestionStatus;
    readonly suggestions: T[];
}
